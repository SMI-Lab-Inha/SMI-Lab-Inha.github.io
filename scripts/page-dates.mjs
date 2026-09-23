/**
 * Last-modified dates for the sitemap, taken from git rather than the clock.
 *
 * A build timestamp on every page is worse than no date at all: search engines
 * discount `lastmod` when every URL claims to have changed on every deploy, and
 * a dependency bump would otherwise mark all thirty pages as freshly edited.
 *
 * So each route is dated by the most recent commit touching its *content* —
 * the page's own source and the data files it reads. Shared presentation is
 * deliberately excluded: layouts, components and stylesheets are imported by
 * nearly every page, so counting them would stamp all thirty routes with the
 * date of any navigation or CSS tweak. Google asks that `lastmod` track
 * significant content change and says outright not to bump it for a layout
 * change, and a date that moves for everything says nothing about anything.
 *
 * Requires full history. The deploy workflow checks out with fetch-depth: 0 for
 * this reason; on a shallow clone every file reports the same single commit,
 * which is exactly the uniform-date problem this avoids. If the dates cannot be
 * resolved the sitemap simply carries none, which is a valid sitemap.
 */

import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const SRC = path.join(import.meta.dirname, '..', 'src');
const PAGES = path.join(SRC, 'pages');

/** Named exports of data/content.ts and the JSON each one is parsed from. */
const CONTENT_EXPORTS = {
  members: 'members.json',
  alumni: 'alumni.json',
  publications: 'publications.json',
  publicationTags: 'publication-tags.json',
  projects: 'projects.json',
  software: 'software.json',
  news: 'news.json',
  recruitment: 'recruitment.json',
  researchAreas: 'research-areas.json',
  teaching: 'teaching.json',
  links: 'links.json',
};

/** Imported from nearly every page, so changes here are not content changes. */
const PRESENTATION = ['layouts', 'components', 'styles'].map((d) => path.join(SRC, d));

const commitDateCache = new Map();

function commitDate(file) {
  if (commitDateCache.has(file)) return commitDateCache.get(file);
  let iso = null;
  try {
    const out = execFileSync('git', ['log', '-1', '--format=%cI', '--', file], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
    if (out) iso = out;
  } catch {
    // Not a git checkout, or the file is untracked. Leave it undated.
  }
  commitDateCache.set(file, iso);
  return iso;
}

/** Resolve an import specifier to a file under src/, or null if external. */
function resolveImport(specifier, fromFile) {
  if (!specifier.startsWith('.')) return null;
  const base = path.resolve(path.dirname(fromFile), specifier);
  const candidates = [base, `${base}.ts`, `${base}.astro`, `${base}.json`, `${base}.js`];
  return candidates.find((candidate) => fs.existsSync(candidate) && fs.statSync(candidate).isFile()) ?? null;
}

/** Every file under src/ that this one is built from, transitively. */
function dependencies(file, seen = new Set()) {
  if (seen.has(file)) return seen;
  seen.add(file);
  let source;
  try {
    source = fs.readFileSync(file, 'utf8');
  } catch {
    return seen;
  }

  for (const match of source.matchAll(/from\s+['"]([^'"]+)['"]/g)) {
    const specifier = match[1];
    const resolved = resolveImport(specifier, file);
    if (!resolved) continue;

    // Presentation, not content — see the note at the top of this file.
    if (PRESENTATION.some((dir) => resolved.startsWith(dir))) continue;

    // Importing from data/content pulls in only the JSON behind the names
    // actually used, rather than every data file the module happens to parse.
    if (resolved.endsWith(path.join('data', 'content.ts'))) {
      seen.add(resolved);
      const named = source.slice(0, match.index).match(/import\s*{([^}]*)}\s*$/);
      const names = named
        ? named[1].split(',').map((n) => n.replace(/\bas\b[\s\S]*/, '').replace(/type\s+/, '').trim())
        : [];
      for (const name of names) {
        const json = CONTENT_EXPORTS[name];
        if (json) seen.add(path.join(SRC, 'data', json));
      }
      continue;
    }

    dependencies(resolved, seen);
  }
  return seen;
}

function listPages(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return listPages(full);
    return /\.(astro|md)$/.test(entry.name) ? [full] : [];
  });
}

/** Map a page file to the route it produces, or null for non-HTML endpoints. */
function routeOf(file) {
  let rel = path.relative(PAGES, file).split(path.sep).join('/');
  rel = rel.replace(/\.(astro|md)$/, '');
  if (rel === 'index') return '/';
  if (rel === '404') return null;
  rel = rel.replace(/\/index$/, '');
  if (rel.includes('[')) return null; // dynamic routes are dated per item below
  return `/${rel}/`;
}

/**
 * On a shallow clone every file's newest commit is the single fetched one, so
 * every route would claim the same date — the failure this module exists to
 * avoid. Better to emit no dates than uniform ones.
 */
function isShallow() {
  try {
    return (
      execFileSync('git', ['rev-parse', '--is-shallow-repository'], {
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'ignore'],
      }).trim() === 'true'
    );
  } catch {
    return false;
  }
}

export function buildLastmodMap() {
  const map = new Map();
  if (isShallow()) {
    console.warn(
      '[page-dates] shallow clone detected; sitemap will carry no lastmod. ' +
        'Check out with fetch-depth: 0 to date it from history.',
    );
    return map;
  }
  let pages;
  try {
    pages = listPages(PAGES);
  } catch {
    return map;
  }

  for (const page of pages) {
    const route = routeOf(page);
    const dates = [...dependencies(page)].map(commitDate).filter(Boolean);
    if (dates.length === 0) continue;
    const newest = dates.sort().at(-1);

    if (route) {
      map.set(route, newest);
      continue;
    }

    // A dynamic route dates every page it generates by the same dependency
    // set; news items all come from news.json and the same template.
    if (page.includes('[slug]') && page.includes(`news${path.sep}`)) {
      map.set('__news__', newest);
    }
  }
  return map;
}

/**
 * Which routes a set of changed files actually affects.
 *
 * Reuses the same dependency walk as the sitemap dates, so IndexNow submits a
 * page when its content changed and stays quiet when only a layout or a
 * stylesheet moved — the same distinction, for the same reason. Paths are
 * repository-relative, as `git diff --name-only` reports them.
 *
 * Returns route strings, plus the `__news__` marker when the news template or
 * news.json changed, which the caller expands to the individual items.
 */
export function routesAffectedBy(changedFiles) {
  const changed = new Set(changedFiles.map((f) => path.resolve(f.split('/').join(path.sep))));
  const routes = new Set();
  let pages;
  try {
    pages = listPages(PAGES);
  } catch {
    return routes;
  }

  for (const page of pages) {
    const deps = dependencies(page);
    if (![...deps].some((dep) => changed.has(path.resolve(dep)))) continue;
    const route = routeOf(page);
    if (route) routes.add(route);
    else if (page.includes('[slug]') && page.includes(`news${path.sep}`)) routes.add('__news__');
  }
  return routes;
}

export function lastmodFor(url, map) {
  const { pathname } = new URL(url);
  if (map.has(pathname)) return map.get(pathname);
  if (pathname.startsWith('/news/') && map.has('__news__')) return map.get('__news__');
  return undefined;
}
