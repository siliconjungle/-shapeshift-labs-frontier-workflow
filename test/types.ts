import {
  advanceWorkflowInstance,
  compileWorkflow,
  createWorkflowInstance,
  createWorkflowManifest,
  planWorkflowStep,
  type FrontierWorkflowManifest,
  type FrontierWorkflowPlan
} from '../dist/index.js';

const manifest: FrontierWorkflowManifest = createWorkflowManifest({
  id: 'typed.workflow',
  steps: [{
    id: 'draft',
    action: 'draft.create',
    next: 'send',
    expectedPatch: [{ path: '/drafts/:id/status', value: 'draft' }]
  }, {
    id: 'send',
    effect: 'fetch:/send'
  }]
});

const compiled = compileWorkflow(manifest);
const instance = createWorkflowInstance(compiled, { id: 'typed-instance' });
const plan: FrontierWorkflowPlan = planWorkflowStep(compiled, { instance, input: { id: 'd1' } });
const result = advanceWorkflowInstance(compiled, instance, { type: 'step.completed', stepId: 'draft' });

plan.expectedPatch satisfies readonly { path: string }[];
result.instance.workflowId satisfies string;
