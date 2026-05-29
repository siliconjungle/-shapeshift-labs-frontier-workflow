import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { performance } from 'node:perf_hooks';
import { fileURLToPath } from 'node:url';
import {
  advanceWorkflowInstance,
  compileWorkflow,
  createWorkflowInstance,
  createWorkflowManifest,
  planWorkflowStep
} from '../dist/index.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const packageDir = path.resolve(__dirname, '..');
const repoRoot = path.basename(path.dirname(packageDir)) === 'packages'
  ? path.resolve(packageDir, '..', '..')
  : packageDir;
const args = parseArgs(process.argv.slice(2));
const rounds = readPositiveInt(args.rounds, 50);
const outPath = args.out ? path.resolve(repoRoot, args.out) : null;

const frontierManifest = createWorkflowManifest({
  id: 'competitor.workflow',
  startAt: 'draft',
  steps: [
    { id: 'draft', action: 'invoice.createDraft', next: 'validate', expectedPatch: [{ path: '/invoices/:id/status', value: 'draft' }] },
    { id: 'validate', action: 'invoice.validate', retry: { maxAttempts: 3 }, next: 'approve' },
    { id: 'approve', wait: { approval: 'manager' }, next: 'send' },
    { id: 'send', effect: 'fetch:/send' }
  ]
});
const compiled = compileWorkflow(frontierManifest);
const instance = createWorkflowInstance(compiled, { id: 'competitor-instance' }, { now: 1 });

const { createMachine, createActor } = await import('xstate');
const xstateMachine = createXStateMachine();

const rows = [
  measure('frontier-workflow:compile-graph', 128, () => compileWorkflow(frontierManifest).stepsById.size),
  measure('frontier-workflow:plan-step', 512, () => planWorkflowStep(compiled, { instance, input: { id: 'inv-1' } }, { capabilities: [] }, { now: 2 }).blockedReasons.length),
  measure('frontier-workflow:advance-step', 512, () => advanceWorkflowInstance(compiled, instance, { type: 'step.completed', stepId: 'draft', at: 3 }, {}, { now: 3 }).record.id.length),
  measure('plain-json-workflow:compile-graph', 128, () => createPlainGraph().size),
  measure('plain-json-workflow:advance-step', 512, () => plainAdvance('draft').length),
  measure('xstate:create-machine', 128, () => createXStateMachine().id.length),
  measure('xstate:actor-transition', 128, () => {
    const actor = createActor(xstateMachine).start();
    actor.send({ type: 'NEXT' });
    return String(actor.getSnapshot().value).length;
  })
];

const report = {
  package: '@shapeshift-labs/frontier-workflow',
  type: 'competitor',
  generatedAt: new Date().toISOString(),
  node: process.version,
  platform: process.platform + ' ' + process.arch,
  rounds,
  competitors: {
    xstate: readVersion('xstate')
  },
  rows
};

if (outPath) {
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(report, null, 2) + '\n');
}

console.log('frontier-workflow competitor benchmark');
console.log('Node ' + report.node + ' on ' + report.platform + ', rounds=' + rounds);
console.log('Fixture'.padEnd(40) + 'Median'.padStart(12) + 'p95'.padStart(12));
for (const row of rows) {
  console.log(row.fixture.padEnd(40) + formatUs(row.medianUs).padStart(12) + formatUs(row.p95Us).padStart(12));
}
if (outPath) console.log('\nwrote ' + path.relative(repoRoot, outPath));

function createXStateMachine() {
  return createMachine({
    id: 'invoice',
    initial: 'draft',
    states: {
      draft: { on: { NEXT: 'validate' } },
      validate: { on: { NEXT: 'approve', FAIL: 'validate' } },
      approve: { on: { APPROVE: 'send' } },
      send: { type: 'final' }
    }
  });
}

function createPlainGraph() {
  const graph = new Map();
  graph.set('draft', ['validate']);
  graph.set('validate', ['approve']);
  graph.set('approve', ['send']);
  graph.set('send', []);
  return graph;
}

function plainAdvance(step) {
  const graph = createPlainGraph();
  return graph.get(step)?.[0] ?? '';
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

function readVersion(name) {
  for (const root of [packageDir, repoRoot]) {
    const candidate = path.join(root, 'node_modules', ...name.split('/'), 'package.json');
    if (fs.existsSync(candidate)) return JSON.parse(fs.readFileSync(candidate, 'utf8')).version;
  }
  let current = path.dirname(require.resolve(name));
  while (current !== path.dirname(current)) {
    const candidate = path.join(current, 'package.json');
    if (fs.existsSync(candidate)) return JSON.parse(fs.readFileSync(candidate, 'utf8')).version;
    current = path.dirname(current);
  }
  return 'unknown';
}

function formatUs(value) {
  if (value >= 1000) return (value / 1000).toFixed(2) + ' ms';
  return value.toFixed(2) + ' us';
}

function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--rounds') out.rounds = argv[++i];
    else if (arg === '--out') out.out = argv[++i];
    else if (arg === '--help' || arg === '-h') {
      console.log('Usage: npm run bench:competitors -- [--rounds 50] [--out benchmarks/results/frontier-workflow-competitors-latest.json]');
      process.exit(0);
    }
  }
  return out;
}

function readPositiveInt(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : fallback;
}
