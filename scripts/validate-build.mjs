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

function parseCssVariables(block) {
  return new Map(
    [...block.matchAll(/--([\w-]+):\s*(#[\da-f]{6})\s*;/gi)].map((match) => [
      match[1],
      match[2],
    ]),
  );
}

function relativeLuminance(hex) {
  const channels = hex
    .slice(1)
    .match(/../g)
    .map((value) => Number.parseInt(value, 16) / 255)
    .map((value) =>
      value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4,
    );
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}

function contrastRatio(foreground, background) {
  const luminances = [relativeLuminance(foreground), relativeLuminance(background)].sort(
    (a, b) => b - a,
  );
  return (luminances[0] + 0.05) / (luminances[1] + 0.05);
}

const globalCssFile = path.resolve('src/styles/global.css');
const globalCss = fs.readFileSync(globalCssFile, 'utf8');
for (const explicitTheme of ['light', 'dark']) {
  if (!globalCss.includes(`:root[data-theme='${explicitTheme}']`)) {
    fail(globalCssFile, `missing explicit ${explicitTheme} theme override`);
  }
}
const themeBlocks = [...globalCss.matchAll(/:root\s*{([^}]+)}/g)].map((match) =>
  parseCssVariables(match[1]),
);
if (themeBlocks.length !== 2) {
  fail(globalCssFile, `expected light and dark theme variable blocks, found ${themeBlocks.length}`);
} else {
  const [lightTheme, darkTheme] = themeBlocks;
  const contrastChecks = [
    ['light faint text', lightTheme.get('c-text-faint'), lightTheme.get('c-bg')],
    ['dark faint text', darkTheme.get('c-text-faint'), darkTheme.get('c-bg')],
    ['dark primary controls', darkTheme.get('c-navy-deep'), darkTheme.get('c-accent')],
    ['dark hovered controls', darkTheme.get('c-navy-deep'), darkTheme.get('c-accent-hover')],
  ];
  for (const [label, foreground, background] of contrastChecks) {
    if (!foreground || !background) {
      fail(globalCssFile, `could not resolve colours for ${label}`);
      continue;
    }
    const ratio = contrastRatio(foreground, background);
    if (ratio < 4.5) {
      fail(globalCssFile, `${label} contrast is ${ratio.toFixed(2)}:1; expected at least 4.5:1`);
    }
  }
}

for (const file of htmlFiles) {
  const html = fs.readFileSync(file, 'utf8');
  const noindex = /<meta name="robots" content="noindex, nofollow">/.test(html);
  const h1Count = (html.match(/<h1\b/g) ?? []).length;
  if (h1Count !== 1) fail(file, `expected one h1, found ${h1Count}`);
  const headingLevels = [...html.matchAll(/<h([1-6])\b/g)].map((match) => Number(match[1]));
  for (let index = 1; index < headingLevels.length; index += 1) {
    if (headingLevels[index] > headingLevels[index - 1] + 1) {
      fail(
        file,
        `heading level skips from h${headingLevels[index - 1]} to h${headingLevels[index]}`,
      );
    }
  }
  if (!/<html lang="en-GB">/.test(html)) fail(file, 'document language must be British English');
  if (!/<meta property="og:locale" content="en_GB">/.test(html)) {
    fail(file, 'Open Graph locale must be British English');
  }
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

  const themeControlCount = (html.match(/id="theme-select"/g) ?? []).length;
  if (themeControlCount !== 1) {
    fail(file, `expected one colour-theme control, found ${themeControlCount}`);
  }
  for (const theme of ['system', 'light', 'dark']) {
    if (!new RegExp(`<option\\b[^>]*value="${theme}"`).test(html)) {
      fail(file, `colour-theme control is missing the ${theme} option`);
    }
  }
  if (!html.includes("localStorage.getItem('smi-theme')")) {
    fail(file, 'missing early theme-preference restoration');
  }

  if (/(?:[A-Za-z\p{Script=Hangul}]|:)<a\b[^>]*href="mailto:/u.test(html)) {
    fail(file, 'email link is missing whitespace before it');
  }
  if (/<a\b[^>]*href="mailto:[^"]*"[^>]*>[^<]*<\/a>[A-Za-z\p{Script=Hangul}]/u.test(html)) {
    fail(file, 'email link is missing whitespace after it');
  }

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

console.log(`Validated ${htmlFiles.length} HTML pages: British English metadata, colour themes, contrast, heading order, email spacing, images, JSON-LD, TODOs, and internal links.`);
