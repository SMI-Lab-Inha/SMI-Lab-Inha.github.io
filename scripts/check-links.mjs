#!/usr/bin/env node
/**
 * Checks every external URL the site ships.
 *
 * Run it by hand (`npm run check:links`) rather than in CI: external sites go
 * down for reasons that have nothing to do with this repository, and a deploy
 * should not fail because a classification society is rebooting a server.
 *
 * Two behaviours are deliberate.
 *
 *  - Publisher and indexing domains (Elsevier, Wiley, ASME, Scopus and the
 *    rest) answer 403 or 429 to anything that is not a browser. That is
 *    documented bot protection, not a dead link, so those are reported
 *    separately rather than as failures.
 *  - Node's fetch reports a bare TypeError for several live hosts, seemingly
 *    over HTTP/2 negotiation. Anything that fails is therefore retried once
 *    with a plain HTTP/1.1 GET before being called dead.
 */

import fs from 'node:fs';
import path from 'node:path';
import https from 'node:https';
import http from 'node:http';

const DATA = path.join(import.meta.dirname, '..', 'src', 'data');
const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0 Safari/537.36';
const TIMEOUT = 30_000;

const urls = new Map();
for (const file of fs.readdirSync(DATA).filter((f) => f.endsWith('.json'))) {
  const raw = fs.readFileSync(path.join(DATA, file), 'utf8');
  for (const match of raw.matchAll(/"(https?:\/\/[^"\s]+)"/g)) {
    const url = match[1];
    // DOIs are checked against Crossref when a paper is added, and the
    // standards bodies' schema URLs are identifiers rather than links.
    if (/doi\.org|w3\.org|schema\.org/.test(url)) continue;
    if (!urls.has(url)) urls.set(url, file);
  }
}

async function probe(url) {
  try {
    const response = await fetch(url, {
      headers: { 'User-Agent': UA, Accept: '*/*' },
      redirect: 'follow',
      signal: AbortSignal.timeout(TIMEOUT),
    });
    return { status: response.status, finalUrl: response.url };
  } catch (error) {
    return { status: 0, error: error.name };
  }
}

/**
 * HTTP/1.1 fallback. Several hosts that a browser opens without complaint —
 * Scopus and KOSHIPA among them — make Node's fetch throw, and reporting those
 * as dead would train the reader to ignore this script's output.
 */
function probeLegacy(url, depth = 0) {
  return new Promise((resolve) => {
    if (depth > 5) return resolve({ status: 0, error: 'TooManyRedirects' });
    let request;
    try {
      const client = new URL(url).protocol === 'http:' ? http : https;
      request = client.get(
        url,
        { headers: { 'User-Agent': UA, Accept: '*/*' }, timeout: TIMEOUT },
        (response) => {
          const { statusCode, headers } = response;
          response.resume();
          if (statusCode >= 300 && statusCode < 400 && headers.location) {
            return resolve(probeLegacy(new URL(headers.location, url).href, depth + 1));
          }
          resolve({ status: statusCode, finalUrl: url });
        },
      );
    } catch {
      return resolve({ status: 0, error: 'BadURL' });
    }
    request.on('timeout', () => { request.destroy(); resolve({ status: 0, error: 'Timeout' }); });
    request.on('error', (error) => resolve({ status: 0, error: error.code || error.name }));
  });
}

const dead = [];
const blocked = [];
const moved = [];
const tlsChain = [];

// A server that omits its intermediate certificate still opens in a browser,
// because browsers fetch the missing link themselves. Node refuses. That is
// the remote site's misconfiguration, not a broken link on ours.
const TLS_CHAIN_ERRORS = new Set([
  'UNABLE_TO_VERIFY_LEAF_SIGNATURE',
  'UNABLE_TO_GET_ISSUER_CERT_LOCALLY',
  'SELF_SIGNED_CERT_IN_CHAIN',
  'CERT_HAS_EXPIRED',
]);

console.log(`Checking ${urls.size} external URLs from src/data\n`);

for (const [url, source] of urls) {
  let result = await probe(url);
  if (result.status === 0) result = await probeLegacy(url); // see probeLegacy

  if (result.status >= 200 && result.status < 400) {
    if (result.finalUrl && result.finalUrl.replace(/\/$/, '') !== url.replace(/\/$/, '')) {
      moved.push({ url, source, to: result.finalUrl });
    }
    continue;
  }
  if (result.status === 403 || result.status === 429) {
    blocked.push({ url, source, status: result.status });
    continue;
  }
  if (TLS_CHAIN_ERRORS.has(result.error)) {
    tlsChain.push({ url, source, error: result.error });
    continue;
  }
  dead.push({ url, source, status: result.status || result.error });
}

if (moved.length) {
  console.log(`${moved.length} redirected (consider updating to the final URL):`);
  for (const m of moved) console.log(`  ${m.source.padEnd(16)} ${m.url}\n  ${''.padEnd(16)}   -> ${m.to}`);
  console.log('');
}

if (blocked.length) {
  console.log(`${blocked.length} blocked scripted access (expected for publishers, not a failure):`);
  for (const b of blocked) console.log(`  ${String(b.status).padEnd(4)} ${b.source.padEnd(16)} ${b.url}`);
  console.log('');
}

if (tlsChain.length) {
  console.log(`${tlsChain.length} with an incomplete certificate chain (opens in a browser, their misconfiguration):`);
  for (const t of tlsChain) console.log(`  ${t.source.padEnd(16)} ${t.url}  (${t.error})`);
  console.log('');
}

if (dead.length) {
  console.log(`${dead.length} unreachable:`);
  for (const d of dead) console.log(`  ${String(d.status).padEnd(4)} ${d.source.padEnd(16)} ${d.url}`);
  console.log('');
  process.exitCode = 1;
} else {
  console.log('No unreachable URLs.');
}
