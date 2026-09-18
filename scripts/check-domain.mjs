/**
 * Checks that smil.inha.ac.kr still forwards to the site.
 *
 * Inha's IT infrastructure team only supports redirect or frameset forwarding
 * for external sites, as a matter of information-security policy; a CNAME
 * straight to GitHub Pages was requested and declined. So the arrangement is a
 * meta-refresh page served from cicadmin.inha.ac.kr, and this script verifies
 * that arrangement rather than the 301 it would ideally be.
 *
 * Two consequences of the forward are permanent and not faults to report:
 *
 *  - the GitHub address appears in the browser's address bar, because a
 *    meta-refresh genuinely navigates there;
 *  - the institutional domain passes no search authority to the site, because
 *    a delayed meta-refresh is not a permanent redirect.
 *
 * Run with `npm run domain:check`.
 *
 * Note on tooling: curl built against Windows schannel fails to handshake with
 * this host even though the certificate is valid and every other client
 * succeeds. Node's fetch is used here for that reason — a false alarm from the
 * checker is worse than no checker.
 */

import { resolveCname } from 'node:dns/promises';

const DOMAIN = 'smil.inha.ac.kr';
const EXPECTED_TARGET = 'https://smi-lab-inha.github.io';
const REFRESH = /<meta[^>]*http-equiv=["']?refresh["']?[^>]*content=["'][^"']*url=([^"'\s]+)/i;

let failed = false;

function report(ok, message) {
  console.log(`${ok ? '  ok  ' : '  !!  '}${message}`);
  if (!ok) failed = true;
}

try {
  const records = (await resolveCname(DOMAIN)).map((r) => r.replace(/\.$/, '').toLowerCase());
  console.log(`${DOMAIN} is a CNAME to ${records.join(', ')}`);
} catch (error) {
  report(false, `could not resolve ${DOMAIN}: ${error.message}`);
}

for (const scheme of ['https', 'http']) {
  const url = `${scheme}://${DOMAIN}/`;
  try {
    const response = await fetch(url, { redirect: 'manual', signal: AbortSignal.timeout(30_000) });
    const body = await response.text();

    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get('location') ?? '';
      report(
        location.startsWith(EXPECTED_TARGET),
        `${scheme}: ${response.status} redirect to ${location || '(no Location header)'}`,
      );
      continue;
    }

    const target = body.match(REFRESH)?.[1];
    if (!target) {
      report(false, `${scheme}: ${response.status}, but no redirect and no meta refresh — the forward is gone`);
      continue;
    }
    report(
      target.startsWith(EXPECTED_TARGET),
      `${scheme}: ${response.status} with a meta refresh to ${target}`,
    );
  } catch (error) {
    report(false, `${scheme}: request failed (${error.name})`);
  }
}

if (failed) {
  console.error('\nThe forward is not behaving as expected. Ask IT infrastructure to check it.');
  process.exit(1);
}

console.log('\nThe forward is working. It remains a meta refresh, so the GitHub address');
console.log('shows in the address bar and the domain passes no search authority.');
