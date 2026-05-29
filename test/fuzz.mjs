import assert from 'node:assert';
import {
  advanceWorkflowInstance,
  compileWorkflow,
  createWorkflowInstance,
  createWorkflowManifest,
  createWorkflowProof,
  decodeWorkflowJsonl,
  encodeWorkflowJsonl,
  planWorkflowStep,
  queryWorkflowManifest,
  traceWorkflowImpact,
  validateWorkflowManifest
} from '../dist/index.js';

const args = parseArgs(process.argv.slice(2));
const cases = readPositiveInt(args.cases, 500);
let seed = readPositiveInt(args.seed, 0x51f00d23);
let checked = 0;

for (let i = 0; i < cases; i++) {
  const scenario = makeScenario(i);
  const manifest = createWorkflowManifest(scenario);
  const compiled = compileWorkflow(manifest);
  const validation = validateWorkflowManifest(manifest);
  assert.strictEqual(compiled.validation.valid, validation.valid);
  assert.strictEqual(compiled.manifest.steps.length, manifest.steps.length);

  const actionSteps = queryWorkflowManifest(compiled, { types: ['action'] }).steps;
  assert.ok(actionSteps.every((step) => step.type === 'action'));
  const writeSteps = queryWorkflowManifest(manifest, { writes: ['entities.items'] }).steps;
  assert.ok(writeSteps.every((step) => step.writes.includes('entities.items')));

  const instance = createWorkflowInstance(compiled, { id: 'instance-' + i }, { now: i + 1 });
  const plan = planWorkflowStep(compiled, {
    instance,
    input: { id: 'item-' + i },
    dryRun: true
  }, {
    capabilities: ['item.read', 'item.write', 'item.send']
  }, { now: i + 2, jitterSeed: i });
  assert.ok(Array.isArray(plan.blockedReasons));
  assert.ok(plan.expectedPatch.every((patch) => !patch.path.includes(':id')));

  let advanced = advanceWorkflowInstance(compiled, instance, {
    type: 'step.started',
    stepId: manifest.startAt,
    at: i + 3
  }, { capabilities: ['item.read', 'item.write', 'item.send'] }, { now: i + 3, jitterSeed: i });
  assert.ok(advanced.record.id);
  if (manifest.startAt) {
    advanced = advanceWorkflowInstance(compiled, advanced.instance, {
      type: maybe() ? 'step.completed' : 'step.failed',
      stepId: manifest.startAt,
      output: { ok: true },
      error: maybe() ? 'retryable' : undefined,
      at: i + 4
    }, { capabilities: ['item.read', 'item.write', 'item.send'] }, { now: i + 4, jitterSeed: i });
    assert.ok(['running', 'waiting', 'completed', 'retrying', 'compensating', 'failed'].includes(advanced.instance.status));
  }

  const impact = traceWorkflowImpact(compiled, { nodes: ['entities.items'] });
  assert.ok(Array.isArray(impact.stepIds));
  const jsonl = encodeWorkflowJsonl([plan, advanced.record]);
  assert.strictEqual(decodeWorkflowJsonl(jsonl).length, 2);
  assert.notStrictEqual(createWorkflowProof(manifest).hash.length, 0);
  checked++;
}

console.log('frontier-workflow fuzz ok: ' + checked + ' cases');

function makeScenario(index) {
  const count = 3 + nextInt(8);
  const steps = [];
  for (let i = 0; i < count; i++) {
    const id = 'step' + i;
    const next = i + 1 < count ? 'step' + (i + 1) : undefined;
    const type = pick(['action', 'effect', 'wait', 'approval', 'manual']);
    const step = {
      id,
      type,
      next,
      reads: ['entities.items'],
      writes: maybe() ? ['entities.items'] : [],
      requires: [pick(['item.read', 'item.write', 'item.send'])],
      retry: maybe() ? { maxAttempts: 3, initialDelayMs: 10, maxDelayMs: 100, backoff: 2 } : undefined,
      expectedPatch: [{ op: 'set', path: '/entities/items/:id/state', value: '$input.id' }],
      compensation: maybe() ? [{ action: 'item.rollback' + i }] : undefined,
      tags: [i % 2 === 0 ? 'even' : 'odd']
    };
    if (type === 'action') step.action = 'items.action' + i;
    if (type === 'effect') {
      step.effect = 'fetch:/api/items/' + i;
      step.effects = [step.effect];
    }
    if (type === 'wait') step.wait = { signal: 'signal.' + (index % 3) };
    if (type === 'approval') step.wait = { approval: 'manager' };
    steps.push(step);
  }
  if (maybe()) steps.push({ id: 'unreachable-' + index, action: 'noop' });
  return {
    id: 'workflow-fuzz-' + index,
    startAt: 'step0',
    steps,
    metadata: { seed }
  };
}

function pick(values) {
  return values[nextInt(values.length)];
}

function maybe() {
  return (next() & 1) === 1;
}

function nextInt(max) {
  return next() % max;
}

function next() {
  seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
  return seed;
}

function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--cases') out.cases = argv[++i];
    else if (argv[i] === '--seed') out.seed = argv[++i];
  }
  return out;
}

function readPositiveInt(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : fallback;
}
