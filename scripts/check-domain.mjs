import { resolveCname } from 'node:dns/promises';

const domain = 'smil.inha.ac.kr';
const destinationOrigin = 'https://smi-lab-inha.github.io';
const probes = [
  { path: '/', required: true },
  { path: '/research/research-areas/?smil_forward_check=1', required: false },
];
let failed = false;

try {
  const records = (await resolveCname(domain)).map((record) => record.replace(/\.$/, '').toLowerCase());
  console.log(`CNAME: ${records.join(', ')}`);
} catch (error) {
  console.error(`Could not resolve ${domain}: ${error.message}`);
  failed = true;
}

for (const probe of probes) {
  const source = new URL(probe.path, `https://${domain}`);
  try {
    const response = await fetch(source, { redirect: 'manual' });
    const location = response.headers.get('location');
    console.log(`${source.pathname}${source.search}: ${response.status}${location ? ` -> ${location}` : ''}`);

    if (![301, 308].includes(response.status) || !location) {
      const message = 'Expected a permanent HTTP redirect (301 or 308).';
      probe.required ? console.error(message) : console.warn(`Optional path forwarding: ${message}`);
      if (probe.required) failed = true;
      continue;
    }

    const target = new URL(location, source);
    if (target.origin !== destinationOrigin) {
      const message = `Expected redirect origin ${destinationOrigin}, received ${target.origin}.`;
      probe.required ? console.error(message) : console.warn(`Optional path forwarding: ${message}`);
      if (probe.required) failed = true;
    }
    if (target.pathname !== source.pathname || target.search !== source.search) {
      const message = 'The redirect does not preserve the path and query string.';
      probe.required ? console.error(message) : console.warn(`Optional path forwarding: ${message}`);
      if (probe.required) failed = true;
    }
  } catch (error) {
    const message = `HTTPS forwarding check failed for ${source}: ${error.message}`;
    probe.required ? console.error(message) : console.warn(`Optional path forwarding: ${message}`);
    if (probe.required) failed = true;
  }
}

process.exitCode = failed ? 1 : 0;
