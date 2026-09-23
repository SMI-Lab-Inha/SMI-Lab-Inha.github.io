/**
 * Push changed URLs to IndexNow after a deploy.
 *
 * IndexNow lets a site tell search engines what changed instead of waiting to
 * be crawled. Bing, Naver, Yandex and Seznam share one endpoint; Google does
 * not participate, so this supplements the sitemap rather than replacing it.
 * Naver is the slow crawler of the three we are verified with, and the one
 * this helps most.
 *
 * Only genuinely changed pages are submitted. Which pages those are comes from
 * the same dependency walk that dates the sitemap, so a stylesheet or layout
 * edit submits nothing — repeatedly announcing unchanged URLs is what gets a
 * site rate-limited, and 429 is one of the documented responses.
 *
 * Run after the deploy is live, never before: an engine that fetches on the
 * hint would otherwise read the previous build.
 *
 *   node scripts/indexnow.mjs --before <sha> --after <sha>
 *   node scripts/indexnow.mjs --all        # every URL in the sitemap
 *   node scripts/indexnow.mjs --dry-run    # print, submit nothing
 *
 * The key is public by design: ownership is proved by serving it at
 * <site>/<key>.txt, which is why it lives in the repository.
 */

import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { routesAffectedBy } from './page-dates.mjs';

const KEY = '4531bb7676af469187f59af6eac3e36a';
const ENDPOINT = 'https://api.indexnow.org/indexnow';

// Must match astro.config.mjs; read from it so the two cannot drift.
const configPath = path.join(import.meta.dirname, '..', 'astro.config.mjs');
const SITE = fs.readFileSync(configPath, 'utf8').match(/site:\s*['"]([^'"]+)['"]/)?.[1];
if (!SITE) throw new Error('could not read `site` from astro.config.mjs');
const HOST = new URL(SITE).host;

const args = process.argv.slice(2);
const flag = (name) => args.includes(`--${name}`);
const value = (name) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : undefined;
};

/** Every URL the deployed sitemap advertises. */
async function sitemapUrls() {
  const index = await (await fetch(new URL('/sitemap-index.xml', SITE))).text();
  const children = [...index.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  const urls = [];
  for (const child of children) {
    const body = await (await fetch(child)).text();
    urls.push(...[...body.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]));
  }
  return urls;
}

function changedFiles(before, after) {
  const out = execFileSync('git', ['diff', '--name-only', `${before}`, `${after}`], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'ignore'],
  });
  return out.split('\n').map((l) => l.trim()).filter(Boolean);
}

const all = await sitemapUrls();
let urls;

if (flag('all')) {
  urls = all;
  console.log(`[indexnow] --all: submitting every URL (${urls.length})`);
} else {
  const before = value('before');
  const after = value('after') ?? 'HEAD';
  // A zeroed or absent SHA means there is no previous state to diff against —
  // a first deploy, or a manual run. Submitting everything once is right then.
  if (!before || /^0{7,40}$/.test(before)) {
    urls = all;
    console.log(`[indexnow] no usable previous commit; submitting every URL (${urls.length})`);
  } else {
    const files = changedFiles(before, after);
    const routes = routesAffectedBy(files);
    console.log(`[indexnow] ${files.length} changed file(s) -> ${routes.size} affected route(s)`);
    urls = all.filter((u) => {
      const { pathname } = new URL(u);
      if (routes.has(pathname)) return true;
      return routes.has('__news__') && pathname.startsWith('/news/');
    });
  }
}

if (urls.length === 0) {
  console.log('[indexnow] no content pages changed; nothing to submit');
  process.exit(0);
}

for (const u of urls) console.log(`  ${u}`);

if (flag('dry-run')) {
  console.log('[indexnow] dry run; nothing submitted');
  process.exit(0);
}

const body = {
  host: HOST,
  key: KEY,
  keyLocation: new URL(`/${KEY}.txt`, SITE).href,
  urlList: urls,
};

const response = await fetch(ENDPOINT, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json; charset=utf-8' },
  body: JSON.stringify(body),
});

// Documented responses: 200 accepted, 202 accepted pending key validation,
// 400 malformed, 403 key not valid, 422 URL not on this host, 429 rate limited.
const detail = await response.text().catch(() => '');
console.log(`[indexnow] ${response.status} ${response.statusText} ${detail}`.trim());

// A failed hint must not fail a deploy that already succeeded. The pages are
// live either way, and the sitemap still advertises them.
if (!response.ok) {
  console.warn('[indexnow] submission was not accepted; the deploy itself is unaffected');
}
