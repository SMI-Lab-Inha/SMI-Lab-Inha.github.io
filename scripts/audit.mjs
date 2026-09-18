#!/usr/bin/env node
/**
 * A health report for the built site. Run with `npm run audit` after a build.
 *
 * This is deliberately *not* a gate. `validate-build.mjs` is the gate: it fails
 * the build on things that are unambiguously wrong. This prints numbers and
 * leaves the judgement to a person, because most of what makes a site good —
 * whether the copy reads well, whether the research is explained clearly — is
 * not measurable, and a script that pretended otherwise would be lying.
 *
 * What it does give you is a baseline. Several of these figures were found by
 * hand once and would have decayed silently: the publications index had no
 * inbound links at all, six runs of Korean carried no language marker, five
 * conference papers were reachable only through an orphaned page. Checking them
 * takes a second now.
 */

import fs from 'node:fs';
import path from 'node:path';

const DIST = path.resolve('dist');
const DATA = path.resolve('src/data');

if (!fs.existsSync(DIST)) {
  console.error('No dist/ — run `npm run build` first.');
  process.exit(1);
}

function walk(dir, test) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return walk(full, test);
    return test(entry.name) ? [full] : [];
  });
}

const pages = walk(DIST, (n) => n === 'index.html');
const route = (file) =>
  '/' + path.relative(DIST, file).split(path.sep).join('/').replace(/index\.html$/, '');
const read = (file) => fs.readFileSync(file, 'utf8');
const json = (name) => JSON.parse(fs.readFileSync(path.join(DATA, name), 'utf8'));
const section = (title) => console.log(`\n${title}\n${'─'.repeat(title.length)}`);
const row = (label, value) => console.log(`  ${String(label).padEnd(38)}${value}`);

console.log(`SMI Lab site audit — ${new Date().toISOString().slice(0, 10)}`);

/* Content ---------------------------------------------------------------- */
section('Content');
const publications = json('publications.json');
row('pages built', pages.length);
row('journal papers', publications.filter((p) => p.type === 'journal').length);
row('conference papers', publications.filter((p) => p.type === 'conference').length);
row('marked open access', `${publications.filter((p) => p.openAccess).length} of ${publications.length}`);
row('publications without a DOI', publications.filter((p) => !p.doi).length);
row('current members', json('members.json').length);
row('funded projects', json('projects.json').length);
row('news items', json('news.json').length);
row('software packages', json('software.json').length);

/* Structured data -------------------------------------------------------- */
section('Structured data');
const types = new Map();
let badJsonLd = 0;
for (const page of pages) {
  for (const match of read(page).matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
    let parsed;
    try {
      parsed = JSON.parse(match[1]);
    } catch {
      badJsonLd += 1;
      continue;
    }
    for (const node of parsed['@graph'] ?? [parsed]) {
      const type = node['@type'];
      if (type) types.set(type, (types.get(type) ?? 0) + 1);
    }
  }
}
for (const [type, n] of [...types.entries()].sort((a, b) => b[1] - a[1])) row(type, n);
row('unparseable JSON-LD blocks', badJsonLd);

/* Internal linking ------------------------------------------------------- */
section('Internal linking');
const inbound = new Map(pages.map((p) => [route(p), 0]));
for (const page of pages) {
  const from = route(page);
  const seen = new Set();
  for (const match of read(page).matchAll(/href="(\/[^"#?]*)"/g)) {
    let href = match[1];
    if (!href.endsWith('/')) href += '/';
    if (href === from || seen.has(href)) continue;
    seen.add(href);
    if (inbound.has(href)) inbound.set(href, inbound.get(href) + 1);
  }
}
const orphans = [...inbound.entries()].filter(([, n]) => n === 0).map(([r]) => r);
row('pages with no inbound link', orphans.length === 0 ? '0' : orphans.join(', '));
console.log('    (/team/alumni/ is expected: empty, noindex, out of the sitemap)');

/* Language --------------------------------------------------------------- */
section('Language');
const HANGUL = /[가-힯]/;
let marked = 0;
const unmarked = [];
for (const page of pages) {
  const body = (read(page).match(/<body[\s\S]*<\/body>/) ?? [''])[0].replace(/<script[\s\S]*?<\/script>/g, '');
  for (const match of body.matchAll(/<([a-z0-9]+)([^>]*)>([^<]*)/gi)) {
    if (!HANGUL.test(match[3])) continue;
    if (/lang=["']?ko/.test(match[2])) marked += 1;
    else unmarked.push(`${route(page)} <${match[1]}>`);
  }
}
row('Korean runs marked lang="ko"', marked);
row('Korean runs unmarked', unmarked.length === 0 ? '0' : unmarked.join('; '));

/* Weight ----------------------------------------------------------------- */
section('Weight');
const kb = (n) => `${(n / 1024).toFixed(1)} KB`;
const totalOf = (test) =>
  walk(DIST, test).reduce((sum, file) => sum + fs.statSync(file).size, 0);
row('home page HTML', kb(fs.statSync(path.join(DIST, 'index.html')).size));
row('CSS, whole site', kb(totalOf((n) => n.endsWith('.css'))));
row('JS, whole site', kb(totalOf((n) => n.endsWith('.js'))));
row('fonts', kb(totalOf((n) => /\.woff2?$/.test(n))));
row('images', kb(totalOf((n) => /\.(webp|png|jpe?g|svg)$/.test(n))));

/* Reminders -------------------------------------------------------------- */
section('Needs a person, not a script');
console.log('  Search Console verification      not set up');
console.log('  Old Google Site                  still live and competing for the same terms');
console.log('  Korean body copy                 drafted in korean-copy-draft.md, awaiting review');
console.log('\n  npm run check:links   external URLs');
console.log('  npm run domain:check  smil.inha.ac.kr forwarding');
console.log('');
