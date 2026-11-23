// Deploy gate for production dependencies: fails on any high or critical
// advisory, except those listed in EXEMPT below.
//
// `npm audit --audit-level=high` cannot skip a single advisory, and an advisory
// with no patched release would otherwise block every deploy until upstream
// ships a fix. Each exemption names the advisory, why it does not reach the
// built site, and when it was granted. Remove an entry as soon as a fix exists;
// this script says so when an exempted advisory stops appearing.
import { spawnSync } from 'node:child_process';

// Entry form: 'GHSA-xxxx-xxxx-xxxx': 'why it cannot reach the built site'.
// History: GHSA-fc5q-39xc-vjpf (picomatch ReDoS) was exempted on 2026-11-18
// and removed on 2026-11-23, GitHub having withdrawn the advisory.
const EXEMPT = {};

const BLOCKING = new Set(['high', 'critical']);

// A fixed command string: npm is a .cmd shim on Windows and needs a shell.
const run = spawnSync('npm audit --omit=dev --json', { encoding: 'utf8', shell: true });

let report;
try {
  report = JSON.parse(run.stdout);
} catch {
  console.error('npm audit did not return JSON:\n' + (run.stderr || run.stdout));
  process.exit(1);
}

// Only advisory objects carry an id; string entries in `via` are packages that
// merely depend on a vulnerable one, and are covered by the advisory itself.
const advisories = new Map();
for (const vuln of Object.values(report.vulnerabilities ?? {})) {
  for (const via of vuln.via) {
    if (typeof via !== 'object') continue;
    const id = via.url?.split('/').pop() ?? String(via.source);
    advisories.set(id, { id, severity: via.severity, title: via.title, pkg: via.name, url: via.url });
  }
}

const blocking = [];
const exempted = [];
for (const a of advisories.values()) {
  if (!BLOCKING.has(a.severity)) continue;
  (EXEMPT[a.id] ? exempted : blocking).push(a);
}

for (const a of exempted) {
  console.warn(`Exempted: ${a.id} (${a.severity}) ${a.pkg}: ${a.title} — ${EXEMPT[a.id]}`);
}
for (const id of Object.keys(EXEMPT)) {
  if (!advisories.has(id)) {
    console.warn(`Exemption ${id} no longer matches any advisory; remove it from scripts/audit-gate.mjs.`);
  }
}

if (blocking.length) {
  for (const a of blocking) console.error(`Blocking: ${a.id} (${a.severity}) ${a.pkg}: ${a.title} ${a.url}`);
  process.exit(1);
}

console.log(`Audit gate passed: no high or critical advisories outside the ${exempted.length} exempted.`);
