import assert from 'node:assert';
import {
  advanceWorkflowInstance,
  appendWorkflowSessionRecord,
  calculateNextRetryAt,
  compileWorkflow,
  createWorkflowInstance,
  createWorkflowManifest,
  createWorkflowProof,
  createWorkflowRecord,
  createWorkflowRegistryGraph,
  createWorkflowSession,
  createWorkflowTimeline,
  decodeWorkflowJsonl,
  defineWorkflow,
  defineWorkflowStep,
  encodeWorkflowJsonl,
  planWorkflowStep,
  planWorkflowStepAsync,
  queryWorkflowManifest,
  redactWorkflowManifest,
  traceWorkflowImpact,
  validateWorkflowManifest
} from '../dist/index.js';

const manifest = createWorkflowManifest({
  id: 'invoice.approval',
  package: '@app/billing',
  feature: 'invoices',
  owner: 'finance',
  startAt: 'draft',
  metadata: { token: 'secret' },
  steps: [
    {
      id: 'draft',
      action: 'invoice.createDraft',
      reads: ['entities.invoices'],
      writes: ['entities.invoices'],
      requires: ['invoice.write'],
      expectedPatch: [{ op: 'set', path: '/entities/invoices/:id/status', value: 'draft' }],
      next: 'validate',
      compensation: [{ action: 'invoice.deleteDraft', reason: 'draft must be removed if later send fails' }]
    },
    {
      id: 'validate',
      action: 'invoice.validate',
      reads: ['entities.invoices'],
      writes: ['entities.invoices'],
      requires: ['invoice.write'],
      retry: { maxAttempts: 3, initialDelayMs: 100, maxDelayMs: 1000, backoff: 2 },
      next: 'approve'
    },
    {
      id: 'approve',
      wait: { approval: 'manager' },
      next: 'send'
    },
    {
      id: 'send',
      effect: 'fetch:/api/invoices/send',
      effects: ['fetch:/api/invoices/send'],
      writes: ['entities.invoices'],
      requires: ['invoice.send'],
      expectedPatch: [{ op: 'set', path: '/entities/invoices/:id/status', value: 'sent' }],
      compensation: [{ action: 'invoice.markSendFailed' }]
    }
  ]
});

assert.strictEqual(defineWorkflow({ id: 'empty' }).id, 'empty');
assert.strictEqual(defineWorkflowStep({ id: 'x.y', action: 'x.y' }).title, 'Y');
assert.strictEqual(manifest.summary.stepCount, 4);
assert.strictEqual(manifest.summary.actionCount, 2);
assert.strictEqual(manifest.summary.approvalCount, 1);
assert.strictEqual(manifest.summary.compensationCount, 2);

const validation = validateWorkflowManifest(manifest);
assert.strictEqual(validation.valid, true);
const invalid = validateWorkflowManifest({ id: 'bad', startAt: 'missing', steps: [{ id: 'a', next: 'missing' }] });
assert.strictEqual(invalid.valid, false);

const compiled = compileWorkflow(manifest);
assert.strictEqual(compiled.get('draft').id, 'draft');
assert.deepStrictEqual(compiled.next('draft').map((step) => step.id), ['validate']);
assert.deepStrictEqual(queryWorkflowManifest(compiled, { capabilities: ['invoice.write'] }).ids, ['draft', 'validate']);
assert.deepStrictEqual(queryWorkflowManifest(manifest, { waitsFor: ['approval:manager'] }).ids, ['approve']);

let instance = createWorkflowInstance(compiled, {
  id: 'wf-1',
  input: { invoiceId: 'inv-1' }
}, { now: 1000 });
assert.strictEqual(instance.status, 'created');
assert.strictEqual(instance.currentStepId, 'draft');

const blocked = planWorkflowStep(compiled, { instance, input: { id: 'inv-1' } }, {
  capabilities: ['invoice.write']
}, { now: 1000 });
assert.strictEqual(blocked.runnable, true);
assert.deepStrictEqual(blocked.expectedPatch, [{ op: 'set', path: '/entities/invoices/inv-1/status', value: 'draft' }]);

const denied = planWorkflowStep(compiled, { instance }, {
  capabilities: [],
  policyDecision: { allowed: true }
}, { now: 1000 });
assert.strictEqual(denied.runnable, false);
assert.ok(denied.blockedReasons.includes('missing-capability:invoice.write'));

const asyncPlan = await planWorkflowStepAsync(compiled, { instance }, {
  capabilities: ['invoice.write'],
  subject: { id: 'user:1' }
}, {
  now: 1100,
  policyEvaluator: async (request) => {
    assert.strictEqual(request.workflowId, 'invoice.approval');
    assert.strictEqual(request.stepId, 'draft');
    return { allowed: true, allowedSteps: ['draft'] };
  }
});
assert.strictEqual(asyncPlan.runnable, true);

let advanced = advanceWorkflowInstance(compiled, instance, { type: 'step.started', stepId: 'draft', at: 1200 }, {
  capabilities: ['invoice.write']
}, { now: 1200 });
assert.strictEqual(advanced.record.status, 'ok');
assert.strictEqual(advanced.instance.steps.draft.status, 'running');

advanced = advanceWorkflowInstance(compiled, advanced.instance, {
  type: 'step.completed',
  stepId: 'draft',
  output: { invoiceId: 'inv-1' },
  patches: [{ op: 'set', path: '/entities/invoices/inv-1/status', value: 'draft' }],
  at: 1300
}, { capabilities: ['invoice.write'] }, { now: 1300 });
instance = advanced.instance;
assert.strictEqual(instance.currentStepId, 'validate');
assert.strictEqual(instance.status, 'running');
assert.ok(instance.completedStepIds.includes('draft'));

advanced = advanceWorkflowInstance(compiled, instance, {
  type: 'step.started',
  stepId: 'validate',
  at: 1400
}, { capabilities: ['invoice.write'] }, { now: 1400 });
advanced = advanceWorkflowInstance(compiled, advanced.instance, {
  type: 'step.failed',
  stepId: 'validate',
  error: 'temporary',
  at: 1500
}, { capabilities: ['invoice.write'] }, { now: 1500 });
assert.strictEqual(advanced.instance.status, 'retrying');
assert.strictEqual(advanced.record.status, 'retrying');
assert.strictEqual(advanced.record.nextRetryAt, 1600);

advanced.instance.steps.validate.attempts = 3;
advanced = advanceWorkflowInstance(compiled, advanced.instance, {
  type: 'step.failed',
  stepId: 'validate',
  error: 'permanent',
  at: 2000
}, { capabilities: ['invoice.write'] }, { now: 2000 });
assert.strictEqual(advanced.instance.status, 'compensating');
assert.strictEqual(advanced.record.compensation[0].action, 'invoice.deleteDraft');

const waiting = createWorkflowInstance(compiled, {
  id: 'wf-wait',
  status: 'waiting',
  currentStepId: 'approve',
  completedStepIds: ['draft', 'validate']
}, { now: 3000 });
const waitPlan = planWorkflowStep(compiled, { instance: waiting }, { capabilities: ['invoice.send'] }, { now: 3000 });
assert.strictEqual(waitPlan.status, 'waiting');
assert.deepStrictEqual(waitPlan.waitingFor, ['approval:manager']);
const approved = advanceWorkflowInstance(compiled, waiting, {
  type: 'approval',
  approval: 'manager',
  at: 3100
}, { capabilities: ['invoice.send'] }, { now: 3100 });
assert.strictEqual(approved.instance.currentStepId, 'send');
assert.strictEqual(approved.instance.status, 'running');

const graph = createWorkflowRegistryGraph(manifest);
assert.ok(graph.entries.some((entry) => entry.id === 'workflow:invoice.approval'));
assert.ok(graph.edges.some((edge) => edge.kind === 'transitions-to' && edge.to === 'workflow-step:send'));
const impact = traceWorkflowImpact(manifest, { nodes: ['entities.invoices'] });
assert.ok(impact.stepIds.includes('draft'));
assert.ok(impact.workflowIds.includes('invoice.approval'));

const record = createWorkflowRecord({ workflowId: manifest.id, instanceId: 'wf-1', stepId: 'draft', status: 'ok' });
const session = appendWorkflowSessionRecord(createWorkflowSession({ id: 'session-1', workflowId: manifest.id, instanceId: 'wf-1' }), record, 4000);
assert.strictEqual(session.summary.recordCount, 1);
assert.deepStrictEqual(session.summary.stepIds, ['draft']);
assert.strictEqual(createWorkflowTimeline(session).events.length, 1);

const jsonl = encodeWorkflowJsonl([waitPlan, record]);
assert.strictEqual(decodeWorkflowJsonl(jsonl).length, 2);
assert.notStrictEqual(createWorkflowProof(manifest, { generatedAt: 1 }).hash.length, 0);
assert.strictEqual(JSON.stringify(redactWorkflowManifest(manifest)).includes('secret'), false);
assert.strictEqual(calculateNextRetryAt({ maxAttempts: 4, initialDelayMs: 100, backoff: 2, maxDelayMs: 1000 }, 3, 1000), 1400);
