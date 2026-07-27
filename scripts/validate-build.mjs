import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve('dist');
const files = [];

function walk(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) walk(file);
    else files.push(file);
  }
}

walk(root);

const htmlFiles = files.filter((file) => file.endsWith('.html'));
const assets = new Set(files.map((file) => `/${path.relative(root, file).replaceAll('\\', '/')}`));
const routes = new Set(
  htmlFiles.map((file) => {
    const relative = path.relative(root, file).replaceAll('\\', '/');
    if (relative === 'index.html') return '/';
    if (relative.endsWith('/index.html')) return `/${relative.replace(/index\.html$/, '')}`;
    return `/${relative}`;
  }),
);

const failures = [];
const descriptions = new Map();

function fail(file, message) {
  failures.push(`${path.relative(process.cwd(), file)}: ${message}`);
}

function decodeHtmlAttribute(value) {
  return value
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&#x([\da-f]+);/gi, (_, code) => String.fromCodePoint(Number.parseInt(code, 16)))
    .replaceAll('&quot;', '"')
    .replaceAll('&apos;', "'")
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>')
    .replaceAll('&amp;', '&');
}

for (const file of htmlFiles) {
  const html = fs.readFileSync(file, 'utf8');
  const noindex = /<meta name="robots" content="noindex, nofollow">/.test(html);
  const h1Count = (html.match(/<h1\b/g) ?? []).length;
  if (h1Count !== 1) fail(file, `expected one h1, found ${h1Count}`);
  if (/TODO\(user\)|TODO:|TODO\b/.test(html)) fail(file, 'contains a public TODO marker');

  const rawDescription = html.match(/<meta name="description" content="([^"]*)">/)?.[1];
  const description = rawDescription ? decodeHtmlAttribute(rawDescription) : undefined;
  if (!description) fail(file, 'missing meta description');
  else {
    if (description.length < 50 || description.length > 165) {
      fail(file, `meta description length is ${description.length}; expected 50–165`);
    }
    const previous = descriptions.get(description);
    if (previous && !file.endsWith('404.html')) fail(file, `duplicates meta description from ${previous}`);
    descriptions.set(description, path.relative(root, file));
  }

  const canonicalCount = (html.match(/<link rel="canonical"/g) ?? []).length;
  if (noindex && canonicalCount !== 0) fail(file, 'noindex page must not emit a canonical URL');
  if (!noindex && canonicalCount !== 1) fail(file, `expected one canonical URL, found ${canonicalCount}`);

  for (const match of html.matchAll(/<img\b[^>]*>/g)) {
    if (!/\balt="[^"]*"/.test(match[0])) fail(file, `image is missing alt: ${match[0].slice(0, 100)}`);
    if (!/\bwidth="\d+"/.test(match[0]) || !/\bheight="\d+"/.test(match[0])) {
      fail(file, `image is missing intrinsic dimensions: ${match[0].slice(0, 100)}`);
    }
  }

  const currentCount = (html.match(/aria-current="page"/g) ?? []).length;
  if (currentCount > 1) fail(file, `multiple links claim aria-current=page (${currentCount})`);

  for (const match of html.matchAll(/<script[^>]+type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)) {
    try {
      JSON.parse(match[1]);
    } catch (error) {
      fail(file, `invalid JSON-LD: ${error.message}`);
    }
  }

  for (const match of html.matchAll(/href="(\/[^"]*)"/g)) {
    const href = match[1];
    if (href.startsWith('//')) continue;
    const clean = href.split(/[?#]/)[0];
    if (!clean || clean === '/') continue;
    const route = clean.endsWith('/') ? clean : `${clean}/`;
    if (!routes.has(clean) && !routes.has(route) && !assets.has(clean)) {
      fail(file, `broken internal link: ${href}`);
    }
  }
}

if (failures.length > 0) {
  console.error(`Build validation failed with ${failures.length} issue(s):\n${failures.join('\n')}`);
  process.exit(1);
}

console.log(`Validated ${htmlFiles.length} HTML pages: metadata, headings, images, JSON-LD, TODOs, and internal links.`);
