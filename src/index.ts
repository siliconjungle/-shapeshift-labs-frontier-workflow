import type { JsonObject, JsonValue } from '@shapeshift-labs/frontier';
import { cloneJson } from '@shapeshift-labs/frontier/clone';
import {
  createFrontierRegistryGraph,
  normalizeFrontierRegistryPath,
  type FrontierRegistryEdge,
  type FrontierRegistryEntry,
  type FrontierRegistryGraph,
  type FrontierRegistryImpact,
  type FrontierRegistryImpactInput,
  type FrontierRegistryPath,
  type FrontierRegistrySource
} from '@shapeshift-labs/frontier/registry';

export const FRONTIER_WORKFLOW_MANIFEST_KIND = 'frontier.workflow.manifest';
export const FRONTIER_WORKFLOW_MANIFEST_VERSION = 1;
export const FRONTIER_WORKFLOW_STEP_KIND = 'frontier.workflow.step';
export const FRONTIER_WORKFLOW_STEP_VERSION = 1;
export const FRONTIER_WORKFLOW_INSTANCE_KIND = 'frontier.workflow.instance';
export const FRONTIER_WORKFLOW_INSTANCE_VERSION = 1;
export const FRONTIER_WORKFLOW_PLAN_KIND = 'frontier.workflow.plan';
export const FRONTIER_WORKFLOW_PLAN_VERSION = 1;
export const FRONTIER_WORKFLOW_RECORD_KIND = 'frontier.workflow.record';
export const FRONTIER_WORKFLOW_RECORD_VERSION = 1;
export const FRONTIER_WORKFLOW_SESSION_KIND = 'frontier.workflow.session';
export const FRONTIER_WORKFLOW_SESSION_VERSION = 1;
export const FRONTIER_WORKFLOW_PROOF_KIND = 'frontier.workflow.proof';
export const FRONTIER_WORKFLOW_PROOF_VERSION = 1;

export type FrontierWorkflowMaybePromise<T> = T | Promise<T>;
export type FrontierWorkflowStepType =
  | 'action'
  | 'effect'
  | 'wait'
  | 'timer'
  | 'approval'
  | 'choice'
  | 'parallel'
  | 'checkpoint'
  | 'manual'
  | string;
export type FrontierWorkflowInstanceStatus =
  | 'created'
  | 'running'
  | 'waiting'
  | 'blocked'
  | 'retrying'
  | 'compensating'
  | 'completed'
  | 'failed'
  | 'cancelled'
  | string;
export type FrontierWorkflowStepStatus = 'pending' | 'running' | 'waiting' | 'completed' | 'failed' | 'skipped' | string;
export type FrontierWorkflowRecordStatus = 'ok' | 'planned' | 'waiting' | 'blocked' | 'retrying' | 'compensating' | 'failed' | 'cancelled' | string;
export type FrontierWorkflowEventType =
  | 'start'
  | 'plan'
  | 'step.started'
  | 'step.completed'
  | 'step.failed'
  | 'signal'
  | 'timer'
  | 'approval'
  | 'cancel'
  | string;

export interface FrontierWorkflowSourceInput {
  file: string;
  line?: number;
  column?: number;
  symbol?: string;
  exportName?: string;
  package?: string;
}

export interface FrontierWorkflowPatchTemplateInput {
  op?: string;
  path: FrontierRegistryPath | string;
  from?: FrontierRegistryPath | string;
  value?: unknown;
  oldValue?: unknown;
  metadata?: unknown;
}

export interface FrontierWorkflowPatchTemplate {
  op: string;
  path: string;
  from?: string;
  value?: JsonValue;
  oldValue?: JsonValue;
  metadata?: JsonObject;
}

export interface FrontierWorkflowRetryPolicyInput {
  maxAttempts?: number;
  initialDelayMs?: number;
  maxDelayMs?: number;
  backoff?: number;
  jitter?: 'none' | 'full' | 'equal' | string;
  retryOn?: readonly string[];
  nonRetryable?: readonly string[];
  metadata?: unknown;
}

export interface FrontierWorkflowRetryPolicy {
  maxAttempts: number;
  initialDelayMs: number;
  maxDelayMs: number;
  backoff: number;
  jitter: string;
  retryOn: string[];
  nonRetryable: string[];
  metadata?: JsonObject;
}

export interface FrontierWorkflowWaitSpecInput {
  signal?: string;
  approval?: string;
  event?: string;
  until?: number | string;
  timeoutMs?: number;
  metadata?: unknown;
}

export interface FrontierWorkflowWaitSpec {
  signal?: string;
  approval?: string;
  event?: string;
  until?: number | string;
  timeoutMs?: number;
  metadata?: JsonObject;
}

export interface FrontierWorkflowCompensationInput {
  id?: string;
  from?: string;
  action?: string;
  effect?: string;
  step?: string;
  input?: unknown;
  reason?: string;
  retry?: FrontierWorkflowRetryPolicyInput;
  metadata?: unknown;
}

export interface FrontierWorkflowCompensation {
  id: string;
  from?: string;
  action?: string;
  effect?: string;
  step?: string;
  input?: JsonObject;
  reason?: string;
  retry?: FrontierWorkflowRetryPolicy;
  metadata?: JsonObject;
}

export interface FrontierWorkflowChoiceInput {
  when?: string;
  signal?: string;
  approval?: string;
  event?: string;
  next: string;
  metadata?: unknown;
}

export interface FrontierWorkflowChoice {
  when?: string;
  signal?: string;
  approval?: string;
  event?: string;
  next: string;
  metadata?: JsonObject;
}

export interface FrontierWorkflowStepInput {
  id: string;
  title?: string;
  description?: string;
  type?: FrontierWorkflowStepType;
  action?: string;
  effect?: string;
  waitsFor?: string;
  wait?: FrontierWorkflowWaitSpecInput;
  choices?: readonly FrontierWorkflowChoiceInput[];
  next?: string | readonly string[];
  dependsOn?: readonly string[];
  reads?: readonly string[];
  writes?: readonly string[];
  effects?: readonly string[];
  requires?: readonly string[];
  expectedPatch?: readonly FrontierWorkflowPatchTemplateInput[];
  retry?: FrontierWorkflowRetryPolicyInput;
  timeoutMs?: number;
  compensation?: readonly FrontierWorkflowCompensationInput[];
  owner?: string;
  package?: string;
  feature?: string;
  tags?: readonly string[];
  source?: FrontierRegistrySource | FrontierWorkflowSourceInput;
  metadata?: unknown;
}

export interface FrontierWorkflowStep {
  kind: typeof FRONTIER_WORKFLOW_STEP_KIND;
  version: typeof FRONTIER_WORKFLOW_STEP_VERSION;
  id: string;
  title: string;
  description?: string;
  type: FrontierWorkflowStepType;
  action?: string;
  effect?: string;
  waitsFor?: string;
  wait?: FrontierWorkflowWaitSpec;
  choices: FrontierWorkflowChoice[];
  next: string[];
  dependsOn: string[];
  reads: string[];
  writes: string[];
  effects: string[];
  requires: string[];
  expectedPatch: FrontierWorkflowPatchTemplate[];
  retry: FrontierWorkflowRetryPolicy;
  timeoutMs?: number;
  compensation: FrontierWorkflowCompensation[];
  owner?: string;
  package?: string;
  feature?: string;
  tags: string[];
  source?: FrontierRegistrySource;
  metadata?: JsonObject;
}

export interface FrontierWorkflowManifestInput {
  id?: string;
  title?: string;
  description?: string;
  package?: string;
  feature?: string;
  owner?: string;
  startAt?: string;
  steps?: readonly FrontierWorkflowStepInput[];
  compensation?: readonly FrontierWorkflowCompensationInput[];
  resources?: readonly string[];
  capabilities?: readonly string[];
  effects?: readonly string[];
  signals?: readonly string[];
  approvals?: readonly string[];
  timers?: readonly string[];
  tags?: readonly string[];
  source?: FrontierRegistrySource;
  metadata?: unknown;
}

export interface FrontierWorkflowManifest {
  kind: typeof FRONTIER_WORKFLOW_MANIFEST_KIND;
  version: typeof FRONTIER_WORKFLOW_MANIFEST_VERSION;
  id: string;
  title?: string;
  description?: string;
  package?: string;
  feature?: string;
  owner?: string;
  startAt?: string;
  steps: FrontierWorkflowStep[];
  compensation: FrontierWorkflowCompensation[];
  resources: string[];
  capabilities: string[];
  effects: string[];
  signals: string[];
  approvals: string[];
  timers: string[];
  tags: string[];
  source?: FrontierRegistrySource;
  metadata?: JsonObject;
  summary: FrontierWorkflowSummary;
}

export interface FrontierWorkflowSummary {
  stepCount: number;
  actionCount: number;
  effectCount: number;
  waitCount: number;
  timerCount: number;
  approvalCount: number;
  retryableCount: number;
  compensationCount: number;
  terminalCount: number;
}

export interface FrontierWorkflowValidationIssue {
  code: string;
  message: string;
  stepId?: string;
  targetId?: string;
  severity: 'error' | 'warning';
}

export interface FrontierWorkflowValidation {
  valid: boolean;
  issues: FrontierWorkflowValidationIssue[];
}

export interface FrontierWorkflowCompiled {
  kind: 'frontier.workflow.compiled';
  version: 1;
  manifest: FrontierWorkflowManifest;
  stepsById: ReadonlyMap<string, FrontierWorkflowStep>;
  dependentsById: ReadonlyMap<string, readonly string[]>;
  predecessorsById: ReadonlyMap<string, readonly string[]>;
  transitionsById: ReadonlyMap<string, readonly string[]>;
  waitersBySignal: ReadonlyMap<string, readonly string[]>;
  validation: FrontierWorkflowValidation;
  get(stepId: string): FrontierWorkflowStep;
  next(stepId: string): FrontierWorkflowStep[];
}

export interface FrontierWorkflowPolicyDecision {
  allowed?: boolean;
  access?: 'allow' | 'deny' | 'approval-required' | string;
  requiresApproval?: boolean;
  reasons?: readonly string[];
  allowedSteps?: readonly string[];
  deniedSteps?: readonly string[];
  allowedEffects?: readonly string[];
  deniedEffects?: readonly string[];
  allowedActions?: readonly string[];
  deniedActions?: readonly string[];
  redactions?: readonly string[];
  metadata?: JsonObject;
}

export interface FrontierWorkflowPolicyEvaluationInput {
  actor?: unknown;
  subject?: unknown;
  action: 'workflow.step';
  workflowId: string;
  instanceId?: string;
  stepId: string;
  stepType: string;
  resources: string[];
  capabilities: string[];
  effect?: string;
  toolAction?: string;
  state?: unknown;
  input: JsonObject;
  metadata?: JsonObject;
}

export type FrontierWorkflowPolicyEvaluator = (
  input: FrontierWorkflowPolicyEvaluationInput
) => FrontierWorkflowMaybePromise<FrontierWorkflowPolicyDecision | null | undefined>;

export interface FrontierWorkflowContext {
  actor?: unknown;
  subject?: unknown;
  capabilities?: readonly string[];
  state?: unknown;
  policyDecision?: FrontierWorkflowPolicyDecision | null;
  metadata?: unknown;
}

export interface FrontierWorkflowStepRuntime {
  status: FrontierWorkflowStepStatus;
  attempts: number;
  startedAt?: number;
  completedAt?: number;
  failedAt?: number;
  nextRetryAt?: number;
  lastRecordId?: string;
  error?: string;
  output?: JsonValue;
  metadata?: JsonObject;
}

export interface FrontierWorkflowInstanceInput {
  id?: string;
  workflowId?: string;
  manifest?: FrontierWorkflowManifest;
  status?: FrontierWorkflowInstanceStatus;
  currentStepId?: string;
  input?: unknown;
  output?: unknown;
  createdAt?: number;
  updatedAt?: number;
  steps?: Record<string, Partial<FrontierWorkflowStepRuntime>>;
  completedStepIds?: readonly string[];
  blockedReason?: string;
  waitingFor?: readonly string[];
  history?: readonly string[];
  metadata?: unknown;
}

export interface FrontierWorkflowInstance {
  kind: typeof FRONTIER_WORKFLOW_INSTANCE_KIND;
  version: typeof FRONTIER_WORKFLOW_INSTANCE_VERSION;
  id: string;
  workflowId: string;
  status: FrontierWorkflowInstanceStatus;
  currentStepId?: string;
  input?: JsonValue;
  output?: JsonValue;
  createdAt: number;
  updatedAt: number;
  steps: Record<string, FrontierWorkflowStepRuntime>;
  completedStepIds: string[];
  blockedReason?: string;
  waitingFor: string[];
  history: string[];
  metadata?: JsonObject;
}

export interface FrontierWorkflowPlanInput {
  instance?: FrontierWorkflowInstance;
  stepId?: string;
  input?: unknown;
  event?: FrontierWorkflowEventInput;
  dryRun?: boolean;
  causeId?: string;
  metadata?: unknown;
}

export interface FrontierWorkflowPlanOptions {
  now?: number | (() => number);
  policyEvaluator?: FrontierWorkflowPolicyEvaluator;
  jitterSeed?: number;
  metadata?: unknown;
}

export interface FrontierWorkflowPlan {
  kind: typeof FRONTIER_WORKFLOW_PLAN_KIND;
  version: typeof FRONTIER_WORKFLOW_PLAN_VERSION;
  id: string;
  workflowId: string;
  instanceId?: string;
  stepId?: string;
  status: FrontierWorkflowRecordStatus;
  runnable: boolean;
  blockedReasons: string[];
  waitingFor: string[];
  dueAt?: number;
  attempt: number;
  nextRetryAt?: number;
  action?: string;
  effect?: string;
  expectedPatch: FrontierWorkflowPatchTemplate[];
  compensation: FrontierWorkflowCompensation[];
  policyDecision?: FrontierWorkflowPolicyDecision;
  causeId?: string;
  createdAt: number;
  descriptor: FrontierWorkflowPlanDescriptor;
  metadata?: JsonObject;
}

export interface FrontierWorkflowPlanDescriptor {
  raw: JsonObject;
}

export interface FrontierWorkflowEventInput {
  type: FrontierWorkflowEventType;
  stepId?: string;
  signal?: string;
  approval?: string;
  event?: string;
  status?: FrontierWorkflowRecordStatus;
  input?: unknown;
  output?: unknown;
  patches?: readonly FrontierWorkflowPatchTemplateInput[];
  effects?: readonly string[];
  error?: unknown;
  at?: number;
  causeId?: string;
  metadata?: unknown;
}

export interface FrontierWorkflowRecordInput {
  id?: string;
  workflowId?: string;
  instanceId?: string;
  stepId?: string;
  type?: FrontierWorkflowEventType;
  status?: FrontierWorkflowRecordStatus;
  attempt?: number;
  startedAt?: number;
  endedAt?: number;
  durationMs?: number;
  input?: unknown;
  output?: unknown;
  patches?: readonly FrontierWorkflowPatchTemplateInput[];
  effects?: readonly string[];
  waitingFor?: readonly string[];
  nextRetryAt?: number;
  compensation?: readonly FrontierWorkflowCompensationInput[];
  causeId?: string;
  parentId?: string;
  policyDecision?: FrontierWorkflowPolicyDecision;
  error?: unknown;
  metadata?: unknown;
}

export interface FrontierWorkflowRecord {
  kind: typeof FRONTIER_WORKFLOW_RECORD_KIND;
  version: typeof FRONTIER_WORKFLOW_RECORD_VERSION;
  id: string;
  workflowId: string;
  instanceId?: string;
  stepId?: string;
  type: FrontierWorkflowEventType;
  status: FrontierWorkflowRecordStatus;
  attempt: number;
  startedAt?: number;
  endedAt: number;
  durationMs?: number;
  input?: JsonValue;
  output?: JsonValue;
  patches: FrontierWorkflowPatchTemplate[];
  effects: string[];
  waitingFor: string[];
  nextRetryAt?: number;
  compensation: FrontierWorkflowCompensation[];
  causeId?: string;
  parentId?: string;
  policyDecision?: FrontierWorkflowPolicyDecision;
  error?: string;
  metadata?: JsonObject;
}

export interface FrontierWorkflowAdvanceResult {
  instance: FrontierWorkflowInstance;
  record: FrontierWorkflowRecord;
  plan: FrontierWorkflowPlan;
}

export interface FrontierWorkflowSessionInput {
  id?: string;
  workflowId?: string;
  instanceId?: string;
  records?: readonly FrontierWorkflowRecordInput[];
  startedAt?: number;
  endedAt?: number;
  metadata?: unknown;
}

export interface FrontierWorkflowSession {
  kind: typeof FRONTIER_WORKFLOW_SESSION_KIND;
  version: typeof FRONTIER_WORKFLOW_SESSION_VERSION;
  id: string;
  workflowId?: string;
  instanceId?: string;
  records: FrontierWorkflowRecord[];
  startedAt: number;
  endedAt?: number;
  metadata?: JsonObject;
  summary: FrontierWorkflowSessionSummary;
}

export interface FrontierWorkflowSessionSummary {
  recordCount: number;
  failedCount: number;
  retryCount: number;
  compensationCount: number;
  stepIds: string[];
  waitingFor: string[];
}

export interface FrontierWorkflowTimelineEvent {
  id: string;
  at: number;
  stepId?: string;
  status: string;
  type: string;
  durationMs?: number;
  message?: string;
}

export interface FrontierWorkflowTimeline {
  kind: 'frontier.workflow.timeline';
  version: 1;
  workflowId?: string;
  instanceId?: string;
  events: FrontierWorkflowTimelineEvent[];
}

export interface FrontierWorkflowProof {
  kind: typeof FRONTIER_WORKFLOW_PROOF_KIND;
  version: typeof FRONTIER_WORKFLOW_PROOF_VERSION;
  workflowId: string;
  generatedAt: number;
  hash: string;
  summary: FrontierWorkflowSummary | FrontierWorkflowSessionSummary;
  validation?: FrontierWorkflowValidation;
  metadata?: JsonObject;
}

export function defineWorkflow(input: FrontierWorkflowManifestInput): FrontierWorkflowManifest {
  return createWorkflowManifest(input);
}

export function defineWorkflowStep(input: FrontierWorkflowStepInput): FrontierWorkflowStep {
  return normalizeStep(input);
}

export function createWorkflowManifest(input: FrontierWorkflowManifestInput = {}): FrontierWorkflowManifest {
  const steps = (input.steps ?? []).map(normalizeStep);
  const startAt = input.startAt ? normalizeId(input.startAt, 'workflow startAt') : steps[0]?.id;
  const resources = uniqueStrings(input.resources);
  const capabilities = uniqueStrings(input.capabilities);
  const effects = uniqueStrings(input.effects);
  const signals = uniqueStrings(input.signals);
  const approvals = uniqueStrings(input.approvals);
  const timers = uniqueStrings(input.timers);
  for (const step of steps) {
    pushUnique(resources, step.reads);
    pushUnique(resources, step.writes);
    pushUnique(capabilities, step.requires);
    pushUnique(effects, step.effects);
    if (step.effect) pushUnique(effects, [step.effect]);
    if (step.waitsFor) pushUnique(signals, [step.waitsFor]);
    if (step.wait?.signal) pushUnique(signals, [step.wait.signal]);
    if (step.wait?.event) pushUnique(signals, [step.wait.event]);
    if (step.wait?.approval) pushUnique(approvals, [step.wait.approval]);
    if (step.wait?.until !== undefined || step.wait?.timeoutMs !== undefined || step.type === 'timer') pushUnique(timers, [step.id]);
  }
  const compensation = (input.compensation ?? []).map((item, index) => normalizeCompensation(item, index));
  const manifest: FrontierWorkflowManifest = {
    kind: FRONTIER_WORKFLOW_MANIFEST_KIND,
    version: FRONTIER_WORKFLOW_MANIFEST_VERSION,
    id: normalizeId(input.id ?? 'workflow', 'workflow id'),
    ...(input.title ? { title: input.title } : {}),
    ...(input.description ? { description: input.description } : {}),
    ...(input.package ? { package: input.package } : {}),
    ...(input.feature ? { feature: input.feature } : {}),
    ...(input.owner ? { owner: input.owner } : {}),
    ...(startAt ? { startAt } : {}),
    steps,
    compensation,
    resources,
    capabilities,
    effects,
    signals,
    approvals,
    timers,
    tags: uniqueStrings(input.tags),
    ...(input.source ? { source: input.source } : {}),
    ...optionalObject('metadata', input.metadata),
    summary: summarizeWorkflow(steps, compensation)
  };
  return manifest;
}

export function compileWorkflow(manifestOrInput: FrontierWorkflowManifest | FrontierWorkflowManifestInput): FrontierWorkflowCompiled {
  const manifest = isWorkflowManifest(manifestOrInput) ? cloneWorkflowManifest(manifestOrInput) : createWorkflowManifest(manifestOrInput);
  const stepsById = new Map<string, FrontierWorkflowStep>();
  const dependents = new Map<string, string[]>();
  const predecessors = new Map<string, string[]>();
  const transitions = new Map<string, string[]>();
  const waiters = new Map<string, string[]>();
  for (const step of manifest.steps) {
    stepsById.set(step.id, step);
    transitions.set(step.id, transitionTargets(step));
    for (const next of transitionTargets(step)) {
      pushMap(predecessors, next, step.id);
      pushMap(dependents, step.id, next);
    }
    for (const dependency of step.dependsOn) {
      pushMap(dependents, dependency, step.id);
      pushMap(predecessors, step.id, dependency);
    }
    for (const signal of waitKeys(step)) pushMap(waiters, signal, step.id);
  }
  const compiled: FrontierWorkflowCompiled = {
    kind: 'frontier.workflow.compiled',
    version: 1,
    manifest,
    stepsById,
    dependentsById: freezeMapLists(dependents),
    predecessorsById: freezeMapLists(predecessors),
    transitionsById: freezeMapLists(transitions),
    waitersBySignal: freezeMapLists(waiters),
    validation: validateWorkflowManifest(manifest),
    get(stepId) {
      const step = stepsById.get(normalizeId(stepId, 'workflow step id'));
      if (!step) throw new TypeError('unknown workflow step: ' + stepId);
      return step;
    },
    next(stepId) {
      const ids = transitions.get(normalizeId(stepId, 'workflow step id')) ?? [];
      return ids.map((id) => {
        const step = stepsById.get(id);
        if (!step) throw new TypeError('unknown workflow step: ' + id);
        return step;
      });
    }
  };
  return compiled;
}

export const compileWorkflows = compileWorkflow;

export function validateWorkflowManifest(manifestOrInput: FrontierWorkflowManifest | FrontierWorkflowManifestInput): FrontierWorkflowValidation {
  const manifest = isWorkflowManifest(manifestOrInput) ? manifestOrInput : createWorkflowManifest(manifestOrInput);
  const issues: FrontierWorkflowValidationIssue[] = [];
  const seen = new Set<string>();
  for (const step of manifest.steps) {
    if (seen.has(step.id)) {
      issues.push({ code: 'duplicate-step', message: 'duplicate workflow step id: ' + step.id, stepId: step.id, severity: 'error' });
    }
    seen.add(step.id);
  }
  if (manifest.startAt && !seen.has(manifest.startAt)) {
    issues.push({ code: 'unknown-start', message: 'workflow startAt references an unknown step', targetId: manifest.startAt, severity: 'error' });
  }
  for (const step of manifest.steps) {
    for (const target of transitionTargets(step)) {
      if (!seen.has(target)) {
        issues.push({ code: 'unknown-transition', message: 'step transitions to an unknown step: ' + target, stepId: step.id, targetId: target, severity: 'error' });
      }
    }
    for (const dependency of step.dependsOn) {
      if (!seen.has(dependency)) {
        issues.push({ code: 'unknown-dependency', message: 'step depends on an unknown step: ' + dependency, stepId: step.id, targetId: dependency, severity: 'error' });
      }
    }
    for (const compensation of step.compensation) {
      if (compensation.step && !seen.has(compensation.step)) {
        issues.push({ code: 'unknown-compensation-step', message: 'compensation references an unknown step: ' + compensation.step, stepId: step.id, targetId: compensation.step, severity: 'error' });
      }
    }
  }
  if (manifest.startAt) {
    const reached = reachableStepIds(manifest);
    for (const step of manifest.steps) {
      if (!reached.has(step.id)) {
        issues.push({ code: 'unreachable-step', message: 'step is not reachable from startAt: ' + step.id, stepId: step.id, severity: 'warning' });
      }
    }
  }
  return { valid: !issues.some((issue) => issue.severity === 'error'), issues };
}

export function queryWorkflowManifest(manifestOrCompiled: FrontierWorkflowManifest | FrontierWorkflowCompiled, query: {
  steps?: readonly string[];
  reads?: readonly string[];
  writes?: readonly string[];
  effects?: readonly string[];
  capabilities?: readonly string[];
  waitsFor?: readonly string[];
  tags?: readonly string[];
  types?: readonly string[];
} = {}): { kind: 'frontier.workflow.query'; version: 1; ids: string[]; steps: FrontierWorkflowStep[] } {
  const manifest = isCompiledWorkflow(manifestOrCompiled) ? manifestOrCompiled.manifest : manifestOrCompiled;
  const steps = manifest.steps.filter((step) => {
    if (query.steps && !query.steps.includes(step.id)) return false;
    if (query.reads && !overlaps(query.reads, step.reads)) return false;
    if (query.writes && !overlaps(query.writes, step.writes)) return false;
    if (query.effects && !overlaps(query.effects, step.effects.concat(step.effect ? [step.effect] : []))) return false;
    if (query.capabilities && !overlaps(query.capabilities, step.requires)) return false;
    if (query.waitsFor && !overlaps(query.waitsFor, waitKeys(step))) return false;
    if (query.tags && !overlaps(query.tags, step.tags)) return false;
    if (query.types && !query.types.includes(step.type)) return false;
    return true;
  });
  return { kind: 'frontier.workflow.query', version: 1, ids: steps.map((step) => step.id), steps };
}

export function createWorkflowInstance(manifestOrCompiled: FrontierWorkflowManifest | FrontierWorkflowCompiled, input: FrontierWorkflowInstanceInput = {}, options: { now?: number | (() => number) } = {}): FrontierWorkflowInstance {
  const manifest = isCompiledWorkflow(manifestOrCompiled) ? manifestOrCompiled.manifest : manifestOrCompiled;
  const now = readNow(options.now);
  const steps: Record<string, FrontierWorkflowStepRuntime> = {};
  for (const step of manifest.steps) {
    const existing = input.steps?.[step.id];
    steps[step.id] = {
      status: existing?.status ?? 'pending',
      attempts: Math.max(0, Math.floor(existing?.attempts ?? 0)),
      ...(existing?.startedAt !== undefined ? { startedAt: existing.startedAt } : {}),
      ...(existing?.completedAt !== undefined ? { completedAt: existing.completedAt } : {}),
      ...(existing?.failedAt !== undefined ? { failedAt: existing.failedAt } : {}),
      ...(existing?.nextRetryAt !== undefined ? { nextRetryAt: existing.nextRetryAt } : {}),
      ...(existing?.lastRecordId ? { lastRecordId: existing.lastRecordId } : {}),
      ...(existing?.error ? { error: existing.error } : {}),
      ...optionalJsonValue('output', existing?.output),
      ...optionalObject('metadata', existing?.metadata)
    };
  }
  const currentStepId = input.currentStepId ?? manifest.startAt;
  return {
    kind: FRONTIER_WORKFLOW_INSTANCE_KIND,
    version: FRONTIER_WORKFLOW_INSTANCE_VERSION,
    id: normalizeId(input.id ?? manifest.id + ':instance', 'workflow instance id'),
    workflowId: normalizeId(input.workflowId ?? manifest.id, 'workflow id'),
    status: input.status ?? 'created',
    ...(currentStepId ? { currentStepId } : {}),
    ...optionalJsonValue('input', input.input),
    ...optionalJsonValue('output', input.output),
    createdAt: input.createdAt ?? now,
    updatedAt: input.updatedAt ?? now,
    steps,
    completedStepIds: uniqueStrings(input.completedStepIds),
    ...(input.blockedReason ? { blockedReason: input.blockedReason } : {}),
    waitingFor: uniqueStrings(input.waitingFor),
    history: uniqueStrings(input.history),
    ...optionalObject('metadata', input.metadata)
  };
}

export function planWorkflowStep(
  manifestOrCompiled: FrontierWorkflowManifest | FrontierWorkflowCompiled,
  input: FrontierWorkflowPlanInput = {},
  context: FrontierWorkflowContext = {},
  options: FrontierWorkflowPlanOptions = {}
): FrontierWorkflowPlan {
  const compiled = isCompiledWorkflow(manifestOrCompiled) ? manifestOrCompiled : compileWorkflow(manifestOrCompiled);
  const now = readNow(options.now);
  const instance = input.instance;
  const stepId = input.stepId ?? instance?.currentStepId ?? compiled.manifest.startAt;
  const step = stepId ? compiled.stepsById.get(stepId) : undefined;
  const blockedReasons: string[] = [];
  if (!compiled.validation.valid) blockedReasons.push('invalid-workflow');
  if (!step) blockedReasons.push('unknown-step');
  if (instance && instance.status === 'cancelled') blockedReasons.push('instance-cancelled');
  if (instance && instance.status === 'completed') blockedReasons.push('instance-completed');
  if (step) {
    for (const capability of step.requires) if (!context.capabilities?.includes(capability)) blockedReasons.push('missing-capability:' + capability);
    for (const dependency of step.dependsOn) if (!instance?.completedStepIds.includes(dependency)) blockedReasons.push('dependency-pending:' + dependency);
    const policy = inputPolicyDecision(step, compiled.manifest, instance, input, context);
    collectPolicyBlocks(policy, step, blockedReasons);
  }
  const runtime = step ? instance?.steps[step.id] : undefined;
  const attempt = Math.max(1, (runtime?.attempts ?? 0) + 1);
  const waitingFor = step ? waitKeys(step) : [];
  const nextRetryAt = step && runtime?.status === 'failed'
    ? calculateNextRetryAt(step.retry, runtime.attempts, runtime.failedAt ?? now, options.jitterSeed)
    : undefined;
  if (nextRetryAt !== undefined && nextRetryAt > now) blockedReasons.push('retry-not-due');
  const dueAt = step ? dueAtForStep(step, now) : undefined;
  const waiting = step ? isWaitingStep(step) : false;
  const runnable = !!step && blockedReasons.length === 0 && !waiting;
  const status: FrontierWorkflowRecordStatus = blockedReasons.length !== 0 ? 'blocked' : waiting ? 'waiting' : input.dryRun ? 'planned' : 'ok';
  const expectedPatch = step ? expandPatchTemplates(step.expectedPatch, toJsonObject(input.input)) : [];
  const compensation = step ? step.compensation.concat(compensationsForPriorSteps(compiled, instance)) : [];
  const plan: FrontierWorkflowPlan = {
    kind: FRONTIER_WORKFLOW_PLAN_KIND,
    version: FRONTIER_WORKFLOW_PLAN_VERSION,
    id: 'workflow-plan:' + stableHash([compiled.manifest.id, instance?.id, step?.id, now, input.causeId]),
    workflowId: compiled.manifest.id,
    ...(instance?.id ? { instanceId: instance.id } : {}),
    ...(step?.id ? { stepId: step.id } : {}),
    status,
    runnable,
    blockedReasons,
    waitingFor,
    ...(dueAt !== undefined ? { dueAt } : {}),
    attempt,
    ...(nextRetryAt !== undefined ? { nextRetryAt } : {}),
    ...(step?.action ? { action: step.action } : {}),
    ...(step?.effect ? { effect: step.effect } : {}),
    expectedPatch,
    compensation,
    ...optionalPolicy('policyDecision', step ? inputPolicyDecision(step, compiled.manifest, instance, input, context) : undefined),
    ...(input.causeId ? { causeId: input.causeId } : {}),
    createdAt: now,
    descriptor: {
      raw: {
        workflowId: compiled.manifest.id,
        instanceId: instance?.id ?? null,
        stepId: step?.id ?? null,
        type: step?.type ?? null,
        action: step?.action ?? null,
        effect: step?.effect ?? null,
        waitingFor: toJsonValue(waitingFor),
        blockedReasons: toJsonValue(blockedReasons),
        expectedPatch: toJsonValue(expectedPatch),
        compensation: toJsonValue(compensation.map((item) => item.id))
      }
    },
    ...optionalObject('metadata', input.metadata ?? options.metadata)
  };
  return plan;
}

export async function planWorkflowStepAsync(
  manifestOrCompiled: FrontierWorkflowManifest | FrontierWorkflowCompiled,
  input: FrontierWorkflowPlanInput = {},
  context: FrontierWorkflowContext = {},
  options: FrontierWorkflowPlanOptions = {}
): Promise<FrontierWorkflowPlan> {
  const compiled = isCompiledWorkflow(manifestOrCompiled) ? manifestOrCompiled : compileWorkflow(manifestOrCompiled);
  const instance = input.instance;
  const stepId = input.stepId ?? instance?.currentStepId ?? compiled.manifest.startAt;
  const step = stepId ? compiled.stepsById.get(stepId) : undefined;
  let policyDecision = context.policyDecision ?? null;
  if (step && options.policyEvaluator) {
    policyDecision = await options.policyEvaluator({
      actor: context.actor,
      subject: context.subject,
      action: 'workflow.step',
      workflowId: compiled.manifest.id,
      ...(instance?.id ? { instanceId: instance.id } : {}),
      stepId: step.id,
      stepType: step.type,
      resources: ['workflow:' + compiled.manifest.id, 'workflow-step:' + step.id].concat(step.reads, step.writes),
      capabilities: step.requires,
      ...(step.effect ? { effect: step.effect } : {}),
      ...(step.action ? { toolAction: step.action } : {}),
      state: context.state,
      input: toJsonObject(input.input),
      ...optionalObject('metadata', context.metadata)
    }) ?? null;
  }
  return planWorkflowStep(compiled, input, { ...context, policyDecision }, options);
}

export function advanceWorkflowInstance(
  manifestOrCompiled: FrontierWorkflowManifest | FrontierWorkflowCompiled,
  instanceInput: FrontierWorkflowInstance,
  eventInput: FrontierWorkflowEventInput,
  context: FrontierWorkflowContext = {},
  options: FrontierWorkflowPlanOptions = {}
): FrontierWorkflowAdvanceResult {
  const compiled = isCompiledWorkflow(manifestOrCompiled) ? manifestOrCompiled : compileWorkflow(manifestOrCompiled);
  const now = eventInput.at ?? readNow(options.now);
  const instance = cloneWorkflowInstance(instanceInput);
  const stepId = eventInput.stepId ?? eventStepId(compiled, instance, eventInput);
  const step = stepId ? compiled.stepsById.get(stepId) : undefined;
  const runtime = step ? instance.steps[step.id] ?? { status: 'pending', attempts: 0 } : undefined;
  let status: FrontierWorkflowRecordStatus = eventInput.status ?? 'ok';
  let nextRetryAt: number | undefined;
  let compensation: FrontierWorkflowCompensation[] = [];
  if (eventInput.type === 'start') {
    instance.status = step && isWaitingStep(step) ? 'waiting' : 'running';
    instance.currentStepId = step?.id ?? instance.currentStepId;
  } else if (eventInput.type === 'step.started' && step && runtime) {
    runtime.status = 'running';
    runtime.startedAt = now;
    runtime.attempts += 1;
    instance.status = 'running';
    instance.currentStepId = step.id;
  } else if ((eventInput.type === 'step.completed' || eventInput.type === 'signal' || eventInput.type === 'timer' || eventInput.type === 'approval') && step && runtime) {
    runtime.status = 'completed';
    runtime.completedAt = now;
    delete runtime.error;
    if (eventInput.output !== undefined) runtime.output = cloneJsonValue(eventInput.output);
    pushUnique(instance.completedStepIds, [step.id]);
    const nextId = resolveNextStepId(compiled, step, eventInput);
    if (nextId) {
      instance.currentStepId = nextId;
      const nextStep = compiled.stepsById.get(nextId);
      instance.status = nextStep && isWaitingStep(nextStep) ? 'waiting' : 'running';
      instance.waitingFor = nextStep && isWaitingStep(nextStep) ? waitKeys(nextStep) : [];
    } else {
      instance.status = 'completed';
      delete instance.currentStepId;
      instance.waitingFor = [];
      if (eventInput.output !== undefined) instance.output = cloneJsonValue(eventInput.output);
    }
  } else if (eventInput.type === 'step.failed' && step && runtime) {
    runtime.status = 'failed';
    runtime.failedAt = now;
    runtime.error = stringifyError(eventInput.error);
    const attempts = Math.max(1, runtime.attempts);
    if (shouldRetry(step.retry, attempts, runtime.error)) {
      nextRetryAt = calculateNextRetryAt(step.retry, attempts, now, options.jitterSeed);
      runtime.nextRetryAt = nextRetryAt;
      instance.status = 'retrying';
      status = 'retrying';
    } else {
      compensation = step.compensation.concat(compensationsForPriorSteps(compiled, instance));
      instance.status = compensation.length ? 'compensating' : 'failed';
      status = compensation.length ? 'compensating' : 'failed';
    }
    instance.currentStepId = step.id;
  } else if (eventInput.type === 'cancel') {
    instance.status = 'cancelled';
    status = 'cancelled';
  }
  if (runtime && step) instance.steps[step.id] = runtime;
  instance.updatedAt = now;
  const record = createWorkflowRecord({
    workflowId: compiled.manifest.id,
    instanceId: instance.id,
    stepId,
    type: eventInput.type,
    status,
    attempt: runtime?.attempts ?? 0,
    startedAt: runtime?.startedAt,
    endedAt: now,
    input: eventInput.input,
    output: eventInput.output,
    patches: eventInput.patches,
    effects: eventInput.effects,
    waitingFor: instance.waitingFor,
    nextRetryAt,
    compensation,
    causeId: eventInput.causeId,
    policyDecision: context.policyDecision ?? undefined,
    error: eventInput.error,
    metadata: eventInput.metadata
  });
  if (step) instance.steps[step.id].lastRecordId = record.id;
  instance.history = instance.history.concat(record.id);
  const plan = planWorkflowStep(compiled, { instance, stepId: instance.currentStepId, causeId: record.id }, context, options);
  return { instance, record, plan };
}

export function createWorkflowRecord(input: FrontierWorkflowRecordInput = {}): FrontierWorkflowRecord {
  const endedAt = input.endedAt ?? Date.now();
  const startedAt = input.startedAt;
  return {
    kind: FRONTIER_WORKFLOW_RECORD_KIND,
    version: FRONTIER_WORKFLOW_RECORD_VERSION,
    id: normalizeId(input.id ?? 'workflow-record:' + stableHash([input.workflowId, input.instanceId, input.stepId, input.type, endedAt, input.causeId]), 'workflow record id'),
    workflowId: normalizeId(input.workflowId ?? 'workflow', 'workflow id'),
    ...(input.instanceId ? { instanceId: input.instanceId } : {}),
    ...(input.stepId ? { stepId: input.stepId } : {}),
    type: input.type ?? 'plan',
    status: input.status ?? 'ok',
    attempt: Math.max(0, Math.floor(input.attempt ?? 0)),
    ...(startedAt !== undefined ? { startedAt } : {}),
    endedAt,
    ...(input.durationMs !== undefined ? { durationMs: input.durationMs } : startedAt !== undefined ? { durationMs: Math.max(0, endedAt - startedAt) } : {}),
    ...optionalJsonValue('input', input.input),
    ...optionalJsonValue('output', input.output),
    patches: (input.patches ?? []).map(normalizePatchTemplate),
    effects: uniqueStrings(input.effects),
    waitingFor: uniqueStrings(input.waitingFor),
    ...(input.nextRetryAt !== undefined ? { nextRetryAt: input.nextRetryAt } : {}),
    compensation: (input.compensation ?? []).map((item, index) => normalizeCompensation(item, index)),
    ...(input.causeId ? { causeId: input.causeId } : {}),
    ...(input.parentId ? { parentId: input.parentId } : {}),
    ...optionalPolicy('policyDecision', input.policyDecision),
    ...(input.error !== undefined ? { error: stringifyError(input.error) } : {}),
    ...optionalObject('metadata', input.metadata)
  };
}

export function createWorkflowSession(input: FrontierWorkflowSessionInput = {}): FrontierWorkflowSession {
  const records = (input.records ?? []).map(createWorkflowRecord);
  const session: FrontierWorkflowSession = {
    kind: FRONTIER_WORKFLOW_SESSION_KIND,
    version: FRONTIER_WORKFLOW_SESSION_VERSION,
    id: normalizeId(input.id ?? 'workflow-session:' + stableHash([input.workflowId, input.instanceId, records.length]), 'workflow session id'),
    ...(input.workflowId ? { workflowId: input.workflowId } : {}),
    ...(input.instanceId ? { instanceId: input.instanceId } : {}),
    records,
    startedAt: input.startedAt ?? records[0]?.endedAt ?? Date.now(),
    ...(input.endedAt !== undefined ? { endedAt: input.endedAt } : {}),
    ...optionalObject('metadata', input.metadata),
    summary: summarizeSession(records)
  };
  return session;
}

export function appendWorkflowSessionRecord(
  sessionInput: FrontierWorkflowSession,
  recordInput: FrontierWorkflowRecord | FrontierWorkflowRecordInput,
  endedAt?: number
): FrontierWorkflowSession {
  const record = isWorkflowRecord(recordInput) ? cloneWorkflowRecord(recordInput) : createWorkflowRecord(recordInput);
  const records = sessionInput.records.concat(record);
  return {
    ...sessionInput,
    records,
    ...(endedAt !== undefined ? { endedAt } : {}),
    summary: summarizeSession(records)
  };
}

export function createWorkflowTimeline(sessionOrRecords: FrontierWorkflowSession | readonly FrontierWorkflowRecord[]): FrontierWorkflowTimeline {
  const isSession = isWorkflowSession(sessionOrRecords);
  const records = isSession ? sessionOrRecords.records : sessionOrRecords;
  const events = records
    .map((record: FrontierWorkflowRecord) => ({
      id: record.id,
      at: record.endedAt,
      ...(record.stepId ? { stepId: record.stepId } : {}),
      status: record.status,
      type: record.type,
      ...(record.durationMs !== undefined ? { durationMs: record.durationMs } : {}),
      ...(record.error ? { message: record.error } : {})
    }))
    .sort((left: FrontierWorkflowTimelineEvent, right: FrontierWorkflowTimelineEvent) => left.at - right.at);
  return {
    kind: 'frontier.workflow.timeline',
    version: 1,
    ...(isSession ? { workflowId: sessionOrRecords.workflowId, instanceId: sessionOrRecords.instanceId } : {}),
    events
  };
}

export function createWorkflowRegistryGraph(
  manifestOrCompiled: FrontierWorkflowManifest | FrontierWorkflowCompiled,
  options: { generatedAt?: number; package?: string; metadata?: JsonObject } = {}
): FrontierRegistryGraph {
  const manifest = isCompiledWorkflow(manifestOrCompiled) ? manifestOrCompiled.manifest : manifestOrCompiled;
  const entries: FrontierRegistryEntry[] = [{
    id: 'workflow:' + manifest.id,
    kind: 'workflow',
    description: manifest.description ?? manifest.title,
    package: options.package ?? manifest.package,
    feature: manifest.feature,
    owner: manifest.owner,
    source: manifest.source,
    tags: manifest.tags,
    reads: manifest.resources,
    calls: manifest.steps.map((step) => 'workflow-step:' + step.id),
    metadata: {
      summary: toJsonObject(manifest.summary),
      startAt: manifest.startAt ?? null
    }
  }];
  const edges: FrontierRegistryEdge[] = [];
  for (const step of manifest.steps) {
    entries.push({
      id: 'workflow-step:' + step.id,
      kind: step.type === 'effect' ? 'effect' : step.type === 'action' ? 'action' : 'job',
      description: step.description ?? step.title,
      package: step.package ?? manifest.package,
      feature: step.feature ?? manifest.feature,
      owner: step.owner ?? manifest.owner,
      source: step.source,
      reads: step.reads,
      writes: step.writes,
      calls: [step.action, step.effect].filter((value): value is string => typeof value === 'string'),
      dependsOn: step.dependsOn.map((id) => 'workflow-step:' + id),
      produces: step.expectedPatch.map((patch) => patch.path),
      tags: step.tags,
      metadata: {
        workflowId: manifest.id,
        type: step.type,
        waitsFor: waitKeys(step),
        retry: toJsonObject(step.retry),
        compensation: step.compensation.map((item) => item.id)
      }
    });
    edges.push({ from: 'workflow:' + manifest.id, to: 'workflow-step:' + step.id, kind: 'owns' });
    for (const next of transitionTargets(step)) edges.push({ from: 'workflow-step:' + step.id, to: 'workflow-step:' + next, kind: 'transitions-to' });
    for (const dependency of step.dependsOn) edges.push({ from: 'workflow-step:' + dependency, to: 'workflow-step:' + step.id, kind: 'depends-on' });
    for (const read of step.reads) edges.push({ from: 'workflow-step:' + step.id, to: normalizeFrontierRegistryPath(read), kind: 'declares-read' });
    for (const write of step.writes) edges.push({ from: 'workflow-step:' + step.id, to: normalizeFrontierRegistryPath(write), kind: 'declares-write' });
    for (const effect of step.effects.concat(step.effect ? [step.effect] : [])) edges.push({ from: 'workflow-step:' + step.id, to: effect, kind: 'calls' });
    for (const item of step.compensation) {
      if (item.step) edges.push({ from: 'workflow-step:' + step.id, to: 'workflow-step:' + item.step, kind: 'compensates-with' });
      else if (item.action) edges.push({ from: 'workflow-step:' + step.id, to: item.action, kind: 'compensates-with' });
      else if (item.effect) edges.push({ from: 'workflow-step:' + step.id, to: item.effect, kind: 'compensates-with' });
    }
  }
  return createFrontierRegistryGraph({
    generatedAt: options.generatedAt,
    entries,
    edges,
    metadata: options.metadata
  });
}

export function traceWorkflowImpact(
  manifestOrCompiled: FrontierWorkflowManifest | FrontierWorkflowCompiled,
  input: FrontierRegistryImpactInput = {}
): FrontierRegistryImpact & { workflowIds: string[]; stepIds: string[] } {
  const compiled = isCompiledWorkflow(manifestOrCompiled) ? manifestOrCompiled : compileWorkflow(manifestOrCompiled);
  const manifest = compiled.manifest;
  const seedSet = new Set<string>();
  const normalizedPathSeeds = new Set<string>();
  for (const id of input.ids ?? []) seedSet.add(id);
  for (const node of input.nodes ?? []) {
    seedSet.add(node);
    normalizedPathSeeds.add(normalizeFrontierRegistryPath(node));
  }
  for (const path of input.paths ?? []) normalizedPathSeeds.add(normalizeFrontierRegistryPath(path));
  for (const path of normalizedPathSeeds) seedSet.add(path);
  const touchedStepIds = new Set<string>();
  const workflowEntryId = 'workflow:' + manifest.id;
  if (seedSet.has(manifest.id) || seedSet.has(workflowEntryId)) {
    for (const step of manifest.steps) touchedStepIds.add(step.id);
  }
  for (const step of manifest.steps) {
    const stepEntryId = 'workflow-step:' + step.id;
    if (seedSet.has(step.id) || seedSet.has(stepEntryId)) touchedStepIds.add(step.id);
    else if (input.features?.includes(step.feature ?? manifest.feature ?? '')) touchedStepIds.add(step.id);
    else if (input.packages?.includes(step.package ?? manifest.package ?? '')) touchedStepIds.add(step.id);
    else if (input.tags && step.tags.some((tag) => input.tags?.includes(tag))) touchedStepIds.add(step.id);
    else if (input.files && sources(step.source).some((source) => input.files?.includes(source.file))) touchedStepIds.add(step.id);
    else if (step.reads.some((path) => normalizedPathSeeds.has(normalizeFrontierRegistryPath(path)))) touchedStepIds.add(step.id);
    else if (step.writes.some((path) => normalizedPathSeeds.has(normalizeFrontierRegistryPath(path)))) touchedStepIds.add(step.id);
    else if (step.effects.some((effect) => seedSet.has(effect)) || (step.effect && seedSet.has(step.effect)) || (step.action && seedSet.has(step.action))) touchedStepIds.add(step.id);
  }
  const direction = input.direction ?? 'both';
  const queue = Array.from(touchedStepIds);
  for (let i = 0; i < queue.length; i++) {
    const stepId = queue[i];
    if (direction !== 'reverse') {
      for (const next of compiled.transitionsById.get(stepId) ?? []) {
        if (!touchedStepIds.has(next)) {
          touchedStepIds.add(next);
          queue.push(next);
        }
      }
    }
    if (direction !== 'forward') {
      for (const previous of compiled.predecessorsById.get(stepId) ?? []) {
        if (!touchedStepIds.has(previous)) {
          touchedStepIds.add(previous);
          queue.push(previous);
        }
      }
    }
  }
  const touchedEntries: FrontierRegistryEntry[] = [];
  const edges: FrontierRegistryEdge[] = [];
  if (touchedStepIds.size !== 0 || seedSet.has(workflowEntryId)) {
    touchedEntries.push(workflowRegistryEntry(manifest));
  }
  for (const step of manifest.steps) {
    if (!touchedStepIds.has(step.id)) continue;
    touchedEntries.push(stepRegistryEntry(step, manifest));
    edges.push(...stepRegistryEdges(step, manifest, touchedStepIds));
  }
  const visited = new Set<string>(seedSet);
  for (const entry of touchedEntries) visited.add(entry.id);
  for (const edge of edges) {
    visited.add(edge.from);
    visited.add(edge.to);
  }
  const workflowIds = touchedEntries.some((entry) => entry.id === workflowEntryId) ? [manifest.id] : [];
  const stepIds = manifest.steps.filter((step) => touchedStepIds.has(step.id)).map((step) => step.id);
  return {
    kind: 'frontier.registry.impact',
    version: 1,
    seeds: Array.from(seedSet),
    nodes: Array.from(visited),
    entries: touchedEntries,
    records: [],
    edges,
    workflowIds,
    stepIds
  };
}

function workflowRegistryEntry(manifest: FrontierWorkflowManifest): FrontierRegistryEntry {
  return {
    id: 'workflow:' + manifest.id,
    kind: 'workflow',
    description: manifest.description ?? manifest.title,
    package: manifest.package,
    feature: manifest.feature,
    owner: manifest.owner,
    source: manifest.source,
    tags: manifest.tags,
    reads: manifest.resources,
    calls: manifest.steps.map((step) => 'workflow-step:' + step.id),
    metadata: {
      summary: toJsonObject(manifest.summary),
      startAt: manifest.startAt ?? null
    }
  };
}

function stepRegistryEntry(step: FrontierWorkflowStep, manifest: FrontierWorkflowManifest): FrontierRegistryEntry {
  return {
    id: 'workflow-step:' + step.id,
    kind: step.type === 'effect' ? 'effect' : step.type === 'action' ? 'action' : 'job',
    description: step.description ?? step.title,
    package: step.package ?? manifest.package,
    feature: step.feature ?? manifest.feature,
    owner: step.owner ?? manifest.owner,
    source: step.source,
    reads: step.reads,
    writes: step.writes,
    calls: [step.action, step.effect].filter((value): value is string => typeof value === 'string'),
    dependsOn: step.dependsOn.map((id) => 'workflow-step:' + id),
    produces: step.expectedPatch.map((patch) => patch.path),
    tags: step.tags,
    metadata: {
      workflowId: manifest.id,
      type: step.type,
      waitsFor: toJsonValue(waitKeys(step)),
      retry: toJsonObject(step.retry),
      compensation: toJsonValue(step.compensation.map((item) => item.id))
    }
  };
}

function stepRegistryEdges(step: FrontierWorkflowStep, manifest: FrontierWorkflowManifest, touchedStepIds?: ReadonlySet<string>): FrontierRegistryEdge[] {
  const edges: FrontierRegistryEdge[] = [{ from: 'workflow:' + manifest.id, to: 'workflow-step:' + step.id, kind: 'owns' }];
  for (const next of transitionTargets(step)) {
    if (!touchedStepIds || touchedStepIds.has(next)) edges.push({ from: 'workflow-step:' + step.id, to: 'workflow-step:' + next, kind: 'transitions-to' });
  }
  for (const dependency of step.dependsOn) {
    if (!touchedStepIds || touchedStepIds.has(dependency)) edges.push({ from: 'workflow-step:' + dependency, to: 'workflow-step:' + step.id, kind: 'depends-on' });
  }
  for (const read of step.reads) edges.push({ from: 'workflow-step:' + step.id, to: normalizeFrontierRegistryPath(read), kind: 'declares-read' });
  for (const write of step.writes) edges.push({ from: 'workflow-step:' + step.id, to: normalizeFrontierRegistryPath(write), kind: 'declares-write' });
  for (const effect of step.effects.concat(step.effect ? [step.effect] : [])) edges.push({ from: 'workflow-step:' + step.id, to: effect, kind: 'calls' });
  for (const item of step.compensation) {
    if (item.step && (!touchedStepIds || touchedStepIds.has(item.step))) edges.push({ from: 'workflow-step:' + step.id, to: 'workflow-step:' + item.step, kind: 'compensates-with' });
    else if (item.action) edges.push({ from: 'workflow-step:' + step.id, to: item.action, kind: 'compensates-with' });
    else if (item.effect) edges.push({ from: 'workflow-step:' + step.id, to: item.effect, kind: 'compensates-with' });
  }
  return edges;
}

export function encodeWorkflowJsonl(values: readonly unknown[]): string {
  return values.map((value) => JSON.stringify(value)).join('\n') + (values.length ? '\n' : '');
}

export function decodeWorkflowJsonl(text: string): JsonValue[] {
  return text
    .split(/\r?\n/)
    .filter((line) => line.trim().length !== 0)
    .map((line) => JSON.parse(line) as JsonValue);
}

export function redactWorkflowValue<T extends JsonValue | FrontierWorkflowManifest | FrontierWorkflowInstance | FrontierWorkflowSession>(
  value: T,
  redactions: readonly string[] = ['token', 'secret', 'password', 'authorization', 'cookie']
): T {
  return redactValue(value, redactions) as T;
}

export function redactWorkflowManifest(manifest: FrontierWorkflowManifest, redactions?: readonly string[]): FrontierWorkflowManifest {
  return redactWorkflowValue(manifest, redactions);
}

export function createWorkflowProof(
  value: FrontierWorkflowManifest | FrontierWorkflowSession,
  options: { generatedAt?: number; metadata?: unknown } = {}
): FrontierWorkflowProof {
  const generatedAt = options.generatedAt ?? Date.now();
  const workflowId = isWorkflowManifest(value) ? value.id : value.workflowId ?? 'workflow';
  const summary = isWorkflowManifest(value) ? value.summary : value.summary;
  return {
    kind: FRONTIER_WORKFLOW_PROOF_KIND,
    version: FRONTIER_WORKFLOW_PROOF_VERSION,
    workflowId,
    generatedAt,
    hash: stableHash(redactWorkflowValue(value as JsonValue | FrontierWorkflowManifest | FrontierWorkflowSession)),
    summary,
    ...(isWorkflowManifest(value) ? { validation: validateWorkflowManifest(value) } : {}),
    ...optionalObject('metadata', options.metadata)
  };
}

export function calculateNextRetryAt(policy: FrontierWorkflowRetryPolicyInput | FrontierWorkflowRetryPolicy, attempt: number, failedAt: number, jitterSeed = 0): number {
  const retry = normalizeRetry(policy);
  const exponent = Math.max(0, attempt - 1);
  const rawDelay = Math.min(retry.maxDelayMs, retry.initialDelayMs * Math.pow(retry.backoff, exponent));
  let delay = rawDelay;
  if (retry.jitter === 'full') delay = seededJitter(jitterSeed + attempt, 0, rawDelay);
  else if (retry.jitter === 'equal') delay = rawDelay / 2 + seededJitter(jitterSeed + attempt, 0, rawDelay / 2);
  return Math.max(failedAt, Math.floor(failedAt + delay));
}

function normalizeStep(input: FrontierWorkflowStepInput): FrontierWorkflowStep {
  const id = normalizeId(input.id, 'workflow step id');
  const wait = input.wait ? normalizeWait(input.wait) : input.waitsFor ? { signal: input.waitsFor } : undefined;
  const type = input.type ?? inferStepType(input, wait);
  return {
    kind: FRONTIER_WORKFLOW_STEP_KIND,
    version: FRONTIER_WORKFLOW_STEP_VERSION,
    id,
    title: input.title ?? titleFromId(id),
    ...(input.description ? { description: input.description } : {}),
    type,
    ...(input.action ? { action: input.action } : {}),
    ...(input.effect ? { effect: input.effect } : {}),
    ...(input.waitsFor ? { waitsFor: input.waitsFor } : {}),
    ...(wait ? { wait } : {}),
    choices: (input.choices ?? []).map(normalizeChoice),
    next: normalizeNext(input.next),
    dependsOn: uniqueStrings(input.dependsOn),
    reads: uniqueStrings(input.reads),
    writes: uniqueStrings(input.writes),
    effects: uniqueStrings(input.effects),
    requires: uniqueStrings(input.requires),
    expectedPatch: (input.expectedPatch ?? []).map(normalizePatchTemplate),
    retry: normalizeRetry(input.retry),
    ...(input.timeoutMs !== undefined ? { timeoutMs: input.timeoutMs } : {}),
    compensation: (input.compensation ?? []).map((item, index) => normalizeCompensation({ from: id, ...item }, index)),
    ...(input.owner ? { owner: input.owner } : {}),
    ...(input.package ? { package: input.package } : {}),
    ...(input.feature ? { feature: input.feature } : {}),
    tags: uniqueStrings(input.tags),
    ...(input.source ? { source: input.source } : {}),
    ...optionalObject('metadata', input.metadata)
  };
}

function normalizeRetry(input: FrontierWorkflowRetryPolicyInput | FrontierWorkflowRetryPolicy | undefined): FrontierWorkflowRetryPolicy {
  return {
    maxAttempts: Math.max(1, Math.floor(input?.maxAttempts ?? 1)),
    initialDelayMs: Math.max(0, Math.floor(input?.initialDelayMs ?? 1000)),
    maxDelayMs: Math.max(0, Math.floor(input?.maxDelayMs ?? 60_000)),
    backoff: Math.max(1, Number(input?.backoff ?? 2)),
    jitter: input?.jitter ?? 'none',
    retryOn: uniqueStrings(input?.retryOn),
    nonRetryable: uniqueStrings(input?.nonRetryable),
    ...optionalObject('metadata', input?.metadata)
  };
}

function normalizeWait(input: FrontierWorkflowWaitSpecInput): FrontierWorkflowWaitSpec {
  return {
    ...(input.signal ? { signal: input.signal } : {}),
    ...(input.approval ? { approval: input.approval } : {}),
    ...(input.event ? { event: input.event } : {}),
    ...(input.until !== undefined ? { until: typeof input.until === 'number' ? input.until : input.until } : {}),
    ...(input.timeoutMs !== undefined ? { timeoutMs: input.timeoutMs } : {}),
    ...optionalObject('metadata', input.metadata)
  };
}

function normalizeChoice(input: FrontierWorkflowChoiceInput): FrontierWorkflowChoice {
  return {
    ...(input.when ? { when: input.when } : {}),
    ...(input.signal ? { signal: input.signal } : {}),
    ...(input.approval ? { approval: input.approval } : {}),
    ...(input.event ? { event: input.event } : {}),
    next: normalizeId(input.next, 'workflow choice next'),
    ...optionalObject('metadata', input.metadata)
  };
}

function normalizePatchTemplate(input: FrontierWorkflowPatchTemplateInput): FrontierWorkflowPatchTemplate {
  return {
    op: input.op ?? 'set',
    path: normalizeFrontierRegistryPath(input.path),
    ...(input.from !== undefined ? { from: normalizeFrontierRegistryPath(input.from) } : {}),
    ...optionalJsonValue('value', input.value),
    ...optionalJsonValue('oldValue', input.oldValue),
    ...optionalObject('metadata', input.metadata)
  };
}

function normalizeCompensation(input: FrontierWorkflowCompensationInput, index: number): FrontierWorkflowCompensation {
  const id = input.id ?? input.step ?? input.action ?? input.effect ?? 'compensation-' + index;
  return {
    id: normalizeId(id, 'workflow compensation id'),
    ...(input.from ? { from: input.from } : {}),
    ...(input.action ? { action: input.action } : {}),
    ...(input.effect ? { effect: input.effect } : {}),
    ...(input.step ? { step: input.step } : {}),
    ...optionalObject('input', input.input),
    ...(input.reason ? { reason: input.reason } : {}),
    ...(input.retry ? { retry: normalizeRetry(input.retry) } : {}),
    ...optionalObject('metadata', input.metadata)
  };
}

function summarizeWorkflow(steps: readonly FrontierWorkflowStep[], compensation: readonly FrontierWorkflowCompensation[]): FrontierWorkflowSummary {
  let actionCount = 0;
  let effectCount = 0;
  let waitCount = 0;
  let timerCount = 0;
  let approvalCount = 0;
  let retryableCount = 0;
  let stepCompensationCount = 0;
  let terminalCount = 0;
  for (const step of steps) {
    if (step.action) actionCount++;
    if (step.effect || step.effects.length) effectCount++;
    if (isWaitingStep(step)) waitCount++;
    if (step.type === 'timer' || step.wait?.until !== undefined || step.wait?.timeoutMs !== undefined) timerCount++;
    if (step.type === 'approval' || step.wait?.approval) approvalCount++;
    if (step.retry.maxAttempts > 1) retryableCount++;
    stepCompensationCount += step.compensation.length;
    if (transitionTargets(step).length === 0) terminalCount++;
  }
  return {
    stepCount: steps.length,
    actionCount,
    effectCount,
    waitCount,
    timerCount,
    approvalCount,
    retryableCount,
    compensationCount: compensation.length + stepCompensationCount,
    terminalCount
  };
}

function summarizeSession(records: readonly FrontierWorkflowRecord[]): FrontierWorkflowSessionSummary {
  const failedCount = records.filter((record) => record.status === 'failed').length;
  const retryCount = records.filter((record) => record.status === 'retrying' || record.nextRetryAt !== undefined).length;
  const compensationCount = records.reduce((count, record) => count + record.compensation.length, 0);
  const stepIds = uniqueStrings(records.map((record) => record.stepId).filter((value): value is string => !!value));
  const waitingFor = uniqueStrings(records.flatMap((record) => record.waitingFor));
  return { recordCount: records.length, failedCount, retryCount, compensationCount, stepIds, waitingFor };
}

function inferStepType(input: FrontierWorkflowStepInput, wait?: FrontierWorkflowWaitSpec): FrontierWorkflowStepType {
  if (input.action) return 'action';
  if (input.effect) return 'effect';
  if (wait?.approval) return 'approval';
  if (wait?.until !== undefined || wait?.timeoutMs !== undefined) return 'timer';
  if (wait || input.waitsFor) return 'wait';
  if (input.choices?.length) return 'choice';
  return 'manual';
}

function isWorkflowManifest(value: unknown): value is FrontierWorkflowManifest {
  return isRecord(value) && value.kind === FRONTIER_WORKFLOW_MANIFEST_KIND;
}

function isCompiledWorkflow(value: unknown): value is FrontierWorkflowCompiled {
  return isRecord(value) && value.kind === 'frontier.workflow.compiled';
}

function isWorkflowRecord(value: unknown): value is FrontierWorkflowRecord {
  return isRecord(value) && value.kind === FRONTIER_WORKFLOW_RECORD_KIND;
}

function isWorkflowSession(value: unknown): value is FrontierWorkflowSession {
  return isRecord(value) && value.kind === FRONTIER_WORKFLOW_SESSION_KIND;
}

function isWaitingStep(step: FrontierWorkflowStep): boolean {
  return step.type === 'wait' || step.type === 'timer' || step.type === 'approval' || !!step.wait || !!step.waitsFor;
}

function transitionTargets(step: FrontierWorkflowStep): string[] {
  return uniqueStrings(step.next.concat(step.choices.map((choice) => choice.next)));
}

function waitKeys(step: FrontierWorkflowStep): string[] {
  const keys: string[] = [];
  if (step.waitsFor) keys.push(step.waitsFor);
  if (step.wait?.signal) keys.push(step.wait.signal);
  if (step.wait?.event) keys.push(step.wait.event);
  if (step.wait?.approval) keys.push('approval:' + step.wait.approval);
  if (step.wait?.until !== undefined) keys.push('timer:' + step.id);
  if (step.wait?.timeoutMs !== undefined) keys.push('timeout:' + step.id);
  return uniqueStrings(keys);
}

function dueAtForStep(step: FrontierWorkflowStep, now: number): number | undefined {
  if (typeof step.wait?.until === 'number') return step.wait.until;
  if (step.wait?.timeoutMs !== undefined) return now + step.wait.timeoutMs;
  return undefined;
}

function resolveNextStepId(compiled: FrontierWorkflowCompiled, step: FrontierWorkflowStep, event: FrontierWorkflowEventInput): string | undefined {
  for (const choice of step.choices) {
    if (choice.signal && event.signal === choice.signal) return choice.next;
    if (choice.approval && event.approval === choice.approval) return choice.next;
    if (choice.event && event.event === choice.event) return choice.next;
    if (choice.when && event.status && wildcard(choice.when, event.status)) return choice.next;
  }
  for (const next of step.next) if (compiled.stepsById.has(next)) return next;
  return undefined;
}

function eventStepId(compiled: FrontierWorkflowCompiled, instance: FrontierWorkflowInstance, event: FrontierWorkflowEventInput): string | undefined {
  if (event.stepId) return event.stepId;
  if (event.signal) return compiled.waitersBySignal.get(event.signal)?.[0] ?? instance.currentStepId;
  if (event.approval) return compiled.waitersBySignal.get('approval:' + event.approval)?.[0] ?? instance.currentStepId;
  if (event.event) return compiled.waitersBySignal.get(event.event)?.[0] ?? instance.currentStepId;
  return instance.currentStepId;
}

function shouldRetry(policy: FrontierWorkflowRetryPolicy, attempts: number, error: string | undefined): boolean {
  if (attempts >= policy.maxAttempts) return false;
  if (error && policy.nonRetryable.some((pattern) => wildcard(pattern, error))) return false;
  if (policy.retryOn.length === 0) return true;
  return !!error && policy.retryOn.some((pattern) => wildcard(pattern, error));
}

function inputPolicyDecision(
  step: FrontierWorkflowStep,
  manifest: FrontierWorkflowManifest,
  instance: FrontierWorkflowInstance | undefined,
  input: FrontierWorkflowPlanInput,
  context: FrontierWorkflowContext
): FrontierWorkflowPolicyDecision | undefined {
  if (!context.policyDecision) return undefined;
  return context.policyDecision;
}

function collectPolicyBlocks(policy: FrontierWorkflowPolicyDecision | undefined, step: FrontierWorkflowStep, blockedReasons: string[]): void {
  if (!policy) return;
  if (policy.allowed === false || policy.access === 'deny') blockedReasons.push('policy-denied');
  if (policy.requiresApproval || policy.access === 'approval-required') blockedReasons.push('policy-approval-required');
  if (policy.allowedSteps?.length && !policy.allowedSteps.some((pattern) => wildcard(pattern, step.id))) blockedReasons.push('policy-step-not-allowed');
  if (policy.deniedSteps?.some((pattern) => wildcard(pattern, step.id))) blockedReasons.push('policy-step-denied');
  if (step.action && policy.allowedActions?.length && !policy.allowedActions.some((pattern) => wildcard(pattern, step.action ?? ''))) blockedReasons.push('policy-action-not-allowed');
  if (step.action && policy.deniedActions?.some((pattern) => wildcard(pattern, step.action ?? ''))) blockedReasons.push('policy-action-denied');
  if (step.effect && policy.allowedEffects?.length && !policy.allowedEffects.some((pattern) => wildcard(pattern, step.effect ?? ''))) blockedReasons.push('policy-effect-not-allowed');
  if (step.effect && policy.deniedEffects?.some((pattern) => wildcard(pattern, step.effect ?? ''))) blockedReasons.push('policy-effect-denied');
}

function compensationsForPriorSteps(compiled: FrontierWorkflowCompiled, instance: FrontierWorkflowInstance | undefined): FrontierWorkflowCompensation[] {
  if (!instance) return [];
  const out: FrontierWorkflowCompensation[] = [];
  for (let i = instance.completedStepIds.length - 1; i >= 0; i--) {
    const step = compiled.stepsById.get(instance.completedStepIds[i]);
    if (step) out.push(...step.compensation);
  }
  return out;
}

function expandPatchTemplates(templates: readonly FrontierWorkflowPatchTemplate[], input: JsonObject): FrontierWorkflowPatchTemplate[] {
  const id = typeof input.id === 'string' ? input.id : typeof input.itemId === 'string' ? input.itemId : typeof input.todoId === 'string' ? input.todoId : undefined;
  return templates.map((patch) => ({
    ...patch,
    path: id ? patch.path.replace(/:id\b/g, id) : patch.path,
    ...(patch.from ? { from: id ? patch.from.replace(/:id\b/g, id) : patch.from } : {}),
    ...(typeof patch.value === 'string' && patch.value.startsWith('$input.') ? { value: readInputPath(input, patch.value.slice('$input.'.length)) } : {})
  }));
}

function readInputPath(input: JsonObject, path: string): JsonValue {
  let value: JsonValue | undefined = input;
  for (const part of path.split('.')) {
    if (!isRecord(value)) return null;
    value = value[part];
  }
  return value ?? null;
}

function reachableStepIds(manifest: FrontierWorkflowManifest): Set<string> {
  const byId = new Map(manifest.steps.map((step) => [step.id, step]));
  const reached = new Set<string>();
  const queue = manifest.startAt ? [manifest.startAt] : [];
  for (let i = 0; i < queue.length; i++) {
    const id = queue[i];
    if (reached.has(id)) continue;
    reached.add(id);
    const step = byId.get(id);
    if (!step) continue;
    for (const next of transitionTargets(step)) if (!reached.has(next)) queue.push(next);
  }
  return reached;
}

function cloneWorkflowManifest(manifest: FrontierWorkflowManifest): FrontierWorkflowManifest {
  return cloneJson(toJsonValue(manifest)) as unknown as FrontierWorkflowManifest;
}

function cloneWorkflowInstance(instance: FrontierWorkflowInstance): FrontierWorkflowInstance {
  return cloneJson(toJsonValue(instance)) as unknown as FrontierWorkflowInstance;
}

function cloneWorkflowRecord(record: FrontierWorkflowRecord): FrontierWorkflowRecord {
  return cloneJson(toJsonValue(record)) as unknown as FrontierWorkflowRecord;
}

function cloneJsonValue(value: unknown): JsonValue {
  return cloneJson(toJsonValue(value));
}

function toJsonObject(value: unknown): JsonObject {
  const json = toJsonValue(value);
  return isRecord(json) && !Array.isArray(json) ? json : {};
}

function toJsonValue(value: unknown): JsonValue {
  if (value === null || typeof value === 'string' || typeof value === 'boolean') return value;
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (Array.isArray(value)) return value.map(toJsonValue);
  if (isRecord(value)) {
    const out: JsonObject = {};
    for (const [key, item] of Object.entries(value)) {
      const json = toJsonValue(item);
      if (json !== undefined) out[key] = json;
    }
    return out;
  }
  return null;
}

function optionalObject<K extends string>(key: K, value: unknown): Partial<Record<K, JsonObject>> {
  if (value === undefined) return {};
  const json = toJsonObject(value);
  return Object.keys(json).length || isRecord(value) ? { [key]: json } as Partial<Record<K, JsonObject>> : {};
}

function optionalJsonValue<K extends string>(key: K, value: unknown): Partial<Record<K, JsonValue>> {
  if (value === undefined) return {};
  return { [key]: toJsonValue(value) } as Partial<Record<K, JsonValue>>;
}

function optionalPolicy<K extends string>(key: K, value: FrontierWorkflowPolicyDecision | null | undefined): Partial<Record<K, FrontierWorkflowPolicyDecision>> {
  return value ? { [key]: value } as Partial<Record<K, FrontierWorkflowPolicyDecision>> : {};
}

function redactValue(value: unknown, redactions: readonly string[]): JsonValue {
  if (Array.isArray(value)) return value.map((item) => redactValue(item, redactions));
  if (!isRecord(value)) return toJsonValue(value);
  const out: JsonObject = {};
  for (const [key, item] of Object.entries(value)) {
    if (redactions.some((pattern) => key.toLowerCase().includes(pattern.toLowerCase()))) out[key] = '[redacted]';
    else out[key] = redactValue(item, redactions);
  }
  return out;
}

function normalizeId(value: string, label: string): string {
  const id = String(value ?? '').trim();
  if (!id) throw new TypeError(label + ' must be a non-empty string');
  return id;
}

function normalizeNext(value: string | readonly string[] | undefined): string[] {
  if (!value) return [];
  return uniqueStrings(Array.isArray(value) ? value : [value]);
}

function uniqueStrings(values: readonly (string | undefined | null)[] | undefined): string[] {
  const out: string[] = [];
  if (!values) return out;
  for (const value of values) {
    if (typeof value !== 'string') continue;
    const normalized = value.trim();
    if (normalized && !out.includes(normalized)) out.push(normalized);
  }
  return out;
}

function pushUnique(target: string[], values: readonly string[]): void {
  for (const value of values) if (!target.includes(value)) target.push(value);
}

function pushMap(map: Map<string, string[]>, key: string, value: string): void {
  const list = map.get(key);
  if (list) {
    if (!list.includes(value)) list.push(value);
  } else {
    map.set(key, [value]);
  }
}

function freezeMapLists(map: Map<string, string[]>): ReadonlyMap<string, readonly string[]> {
  return new Map(Array.from(map, ([key, values]) => [key, Object.freeze(values.slice())]));
}

function overlaps(left: readonly string[], right: readonly string[]): boolean {
  return left.some((value) => right.includes(value));
}

function wildcard(pattern: string, value: string): boolean {
  if (pattern === value || pattern === '*') return true;
  if (!pattern.includes('*')) return false;
  const [head, ...tailParts] = pattern.split('*');
  const tail = tailParts.join('*');
  return value.startsWith(head) && value.endsWith(tail);
}

function titleFromId(id: string): string {
  const last = id.split(/[./:-]/).filter(Boolean).pop() ?? id;
  return last.charAt(0).toUpperCase() + last.slice(1).replace(/[-_]/g, ' ');
}

function readNow(now: number | (() => number) | undefined): number {
  return typeof now === 'function' ? now() : now ?? Date.now();
}

function stringifyError(error: unknown): string | undefined {
  if (error === undefined || error === null) return undefined;
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  return JSON.stringify(toJsonValue(error));
}

function sources(source: FrontierRegistrySource | undefined): FrontierWorkflowSourceInput[] {
  if (!source) return [];
  return Array.isArray(source) ? source as FrontierWorkflowSourceInput[] : [source as FrontierWorkflowSourceInput];
}

function isRecord(value: unknown): value is Record<string, JsonValue> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function stableHash(value: unknown): string {
  const text = stableStringify(toJsonValue(value));
  let hash = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash.toString(16).padStart(8, '0');
}

function stableStringify(value: JsonValue): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return '[' + value.map(stableStringify).join(',') + ']';
  const keys = Object.keys(value).sort();
  return '{' + keys.map((key) => JSON.stringify(key) + ':' + stableStringify(value[key])).join(',') + '}';
}

function seededJitter(seed: number, min: number, max: number): number {
  let value = seed >>> 0;
  value = (Math.imul(value, 1664525) + 1013904223) >>> 0;
  return min + (value / 0xffffffff) * (max - min);
}
