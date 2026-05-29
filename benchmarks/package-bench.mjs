import fs from 'node:fs';
import path from 'node:path';
import { performance } from 'node:perf_hooks';
import { fileURLToPath } from 'node:url';
import {
  advanceWorkflowInstance,
  compileWorkflow,
  createWorkflowInstance,
  createWorkflowManifest,
  createWorkflowProof,
  createWorkflowRegistryGraph,
  decodeWorkflowJsonl,
  encodeWorkflowJsonl,
  planWorkflowStep,
  queryWorkflowManifest,
  traceWorkflowImpact,
  validateWorkflowManifest
} from '../dist/index.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const packageDir = path.resolve(__dirname, '..');
const repoRoot = path.basename(path.dirname(packageDir)) === 'packages'
  ? path.resolve(packageDir, '..', '..')
  : packageDir;
const args = parseArgs(process.argv.slice(2));
const stepCount = readPositiveInt(args.steps, 1000);
const rounds = readPositiveInt(args.rounds, 30);
const outPath = args.out ? path.resolve(repoRoot, args.out) : null;

const input = makeWorkflowInput(stepCount);
let manifest = createWorkflowManifest(input);
let compiled = compileWorkflow(manifest);
let instance = createWorkflowInstance(compiled, { id: 'bench-instance' }, { now: 1 });
let plan = planWorkflowStep(compiled, { instance, input: { id: 'item-0' } }, { capabilities: ['bench.read', 'bench.write', 'bench.send'] }, { now: 2 });
let jsonl = encodeWorkflowJsonl([plan]);
let cursor = 0;

const rows = [
  measure('create-manifest-' + stepCount, 1, () => {
    manifest = createWorkflowManifest(input);
    return manifest.steps.length;
  }),
  measure('compile-workflow-' + stepCount, 1, () => {
    compiled = compileWorkflow(manifest);
    return compiled.stepsById.size;
  }),
  measure('validate-workflow-' + stepCount, 1, () => validateWorkflowManifest(manifest).issues.length),
  measure('query-writes-' + stepCount, 16, () => queryWorkflowManifest(manifest, { writes: ['entities.items'] }).steps.length),
  measure('create-instance-' + stepCount, 16, () => createWorkflowInstance(compiled, { id: 'bench-' + cursor++ }, { now: cursor }).completedStepIds.length),
  measure('plan-step-' + stepCount, 64, () => {
    plan = planWorkflowStep(compiled, {
      instance,
      stepId: 'step' + (cursor++ % stepCount),
      input: { id: 'item-' + cursor },
      dryRun: true
    }, { capabilities: ['bench.read', 'bench.write', 'bench.send'] }, { now: cursor });
    return plan.expectedPatch.length;
  }),
  measure('advance-complete-' + stepCount, 64, () => {
    const stepId = 'step' + (cursor++ % stepCount);
    const local = createWorkflowInstance(compiled, { id: 'advance-' + cursor, currentStepId: stepId }, { now: cursor });
    return advanceWorkflowInstance(compiled, local, { type: 'step.completed', stepId, at: cursor }, { capabilities: ['bench.read', 'bench.write', 'bench.send'] }, { now: cursor }).record.attempt;
  }),
  measure('trace-impact-' + stepCount, 8, () => traceWorkflowImpact(compiled, { nodes: ['entities.items'] }).stepIds.length),
  measure('registry-graph-' + stepCount, 1, () => {
    const graph = createWorkflowRegistryGraph(compiled, { package: '@shapeshift-labs/frontier-workflow' });
    return graph.entries.length + graph.edges.length;
  }),
  measure('jsonl-encode-' + stepCount, 8, () => {
    jsonl = encodeWorkflowJsonl([plan]);
    return jsonl.length;
  }),
  measure('jsonl-decode-' + stepCount, 8, () => decodeWorkflowJsonl(jsonl).length),
  measure('proof-' + stepCount, 4, () => createWorkflowProof(manifest).hash.length)
];

const report = {
  package: '@shapeshift-labs/frontier-workflow',
  version: readPackageVersion(),
  generatedAt: new Date().toISOString(),
  node: process.version,
  platform: process.platform + ' ' + process.arch,
  stepCount,
  rounds,
  rows
};

if (outPath) {
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(report, null, 2) + '\n');
}

console.log(report.package + ' package benchmark');
console.log('Node ' + report.node + ' on ' + report.platform + ', steps=' + stepCount + ', rounds=' + rounds);
console.log('These are Frontier-only package measurements, not competitor comparisons.');
console.log('');
console.log(padRight('Fixture', 34) + padLeft('Median', 12) + padLeft('p95', 12));
for (const row of rows) {
  console.log(padRight(row.fixture, 34) + padLeft(formatUs(row.medianUs), 12) + padLeft(formatUs(row.p95Us), 12));
}
if (outPath) console.log('\nwrote ' + path.relative(repoRoot, outPath));

function makeWorkflowInput(count) {
  const steps = [];
  for (let i = 0; i < count; i++) {
    const type = i % 17 === 0 ? 'approval' : i % 11 === 0 ? 'effect' : 'action';
    const step = {
      id: 'step' + i,
      type,
      next: i + 1 < count ? 'step' + (i + 1) : undefined,
      reads: ['entities.items', 'entities.items.' + i],
      writes: ['entities.items'],
      requires: [i % 2 === 0 ? 'bench.read' : 'bench.write'],
      retry: i % 7 === 0 ? { maxAttempts: 3, initialDelayMs: 10, maxDelayMs: 100, backoff: 2 } : undefined,
      expectedPatch: [{ op: 'set', path: '/entities/items/:id/step' + i, value: true }],
      compensation: i % 13 === 0 ? [{ action: 'bench.rollback' + i }] : undefined,
      tags: ['bench', i % 2 === 0 ? 'even' : 'odd']
    };
    if (type === 'approval') step.wait = { approval: 'manager' };
    else if (type === 'effect') {
      step.effect = 'fetch:/api/items/' + i;
      step.effects = [step.effect];
      step.requires = ['bench.send'];
    } else {
      step.action = 'bench.action' + i;
    }
    steps.push(step);
  }
  return {
    id: 'bench.workflow',
    startAt: 'step0',
    steps,
    metadata: { token: 'bench-secret' }
  };
}

function measure(fixture, batchSize, fn) {
  const values = [];
  let sink = 0;
  for (let round = 0; round < rounds; round++) {
    const started = performance.now();
    for (let i = 0; i < batchSize; i++) sink += fn();
    values[values.length] = ((performance.now() - started) * 1000) / batchSize;
  }
  if (sink === -1) console.log('sink=' + sink);
  values.sort((left, right) => left - right);
  return { fixture, medianUs: percentile(values, 0.5), p95Us: percentile(values, 0.95) };
}

function percentile(values, p) {
  return values[Math.min(values.length - 1, Math.floor((values.length - 1) * p))] ?? 0;
}

function formatUs(value) {
  if (value >= 1000) return (value / 1000).toFixed(2) + ' ms';
  return value.toFixed(2) + ' us';
}

function padRight(value, width) {
  return String(value).padEnd(width, ' ');
}

function padLeft(value, width) {
  return String(value).padStart(width, ' ');
}

function readPackageVersion() {
  return JSON.parse(fs.readFileSync(path.join(packageDir, 'package.json'), 'utf8')).version;
}

function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--steps') out.steps = argv[++i];
    else if (arg === '--rounds') out.rounds = argv[++i];
    else if (arg === '--out') out.out = argv[++i];
    else if (arg === '--help' || arg === '-h') {
      console.log('Usage: npm run bench -- [--steps 1000] [--rounds 30] [--out benchmarks/results/frontier-workflow-package-bench-latest.json]');
      process.exit(0);
    }
  }
  return out;
}

function readPositiveInt(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : fallback;
}
