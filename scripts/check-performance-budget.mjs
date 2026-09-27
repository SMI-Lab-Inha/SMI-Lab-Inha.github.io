import fs from 'node:fs';
import path from 'node:path';
import { gzipSync } from 'node:zlib';

const files = (dir) => fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) =>
  entry.isDirectory() ? files(path.join(dir, entry.name)) : [path.join(dir, entry.name)]);
const all = files('dist');
const home = fs.readFileSync('dist/index.html', 'utf8');
const js = [...home.matchAll(/<script(?![^>]*application\/ld\+json)[^>]*>([\s\S]*?)<\/script>/g)].map((match) => match[1]).join('');
const checks = [
  ['Home HTML (gzip)', gzipSync(home).length, 12 * 1024],
  ['Home inline executable JS', Buffer.byteLength(js), 8 * 1024],
  ['All CSS (gzip)', all.filter((file) => file.endsWith('.css')).reduce((sum, file) => sum + gzipSync(fs.readFileSync(file)).length, 0), 24 * 1024],
  ['All fonts', all.filter((file) => file.endsWith('.woff2')).reduce((sum, file) => sum + fs.statSync(file).size, 0), 80 * 1024],
];
for (const [label, size, limit] of checks) {
  console.log(`${label}: ${(size / 1024).toFixed(1)} KB / ${(limit / 1024).toFixed(0)} KB`);
  if (size > limit) throw new Error(`${label} exceeds its performance budget`);
}
