import { resolveCname } from 'node:dns/promises';

const domain = 'smil.inha.ac.kr';
const expectedTarget = 'smi-lab-inha.github.io';
let failed = false;

try {
  const records = (await resolveCname(domain)).map((record) => record.replace(/\.$/, '').toLowerCase());
  console.log(`CNAME: ${records.join(', ')}`);
  if (!records.includes(expectedTarget)) {
    console.error(`Expected ${domain} to point to ${expectedTarget}.`);
    failed = true;
  }
} catch (error) {
  console.error(`Could not resolve ${domain}: ${error.message}`);
  failed = true;
}

try {
  const response = await fetch(`https://${domain}/`, { redirect: 'follow' });
  console.log(`HTTPS: ${response.status} ${response.statusText}`);
  if (!response.ok) {
    failed = true;
  } else {
    const html = await response.text();
    if (!html.includes('Marine Structural Mechanics and Integrity Lab')) {
      console.error('HTTPS does not yet serve the new SMI Lab site.');
      failed = true;
    }
  }
} catch (error) {
  console.error(`HTTPS failed: ${error.message}`);
  failed = true;
}

process.exitCode = failed ? 1 : 0;
