// Converts the supplied news photographs to web-sized WebP.
//
// Sources sit in photos/ at the repo root, named by news item. They are not
// committed: only the derived files under public/images/news/ are. Aspect
// ratios vary a lot (403x469 to 1280x674), so images are fitted inside a
// bounding box rather than cropped — a crop would cut faces out of the
// portrait-shaped ones.
import sharp from 'sharp';
import fs from 'node:fs';
import path from 'node:path';

const SRC = 'photos';
const OUT = 'public/images/news';

const MAP = {
  '1_SNAK.png': 'snakzine',
  '2.Arirang.png': 'arirang-tv',
  '3.Inha interview.png': 'inha-interview',
  '4. KSOE presentation.png': 'ksoe-2025',
  '5. MADEX.jpg': 'madex-2025',
  '6. JMSE SI 1.png': 'jmse-special-issue-1',
  '7. JMSE SI 2.png': 'jmse-special-issue-2',
  '8. ISSC.png': 'issc-2025',
  "9. Teacher's day.png": 'teachers-day',
  '10. INAOE.png': 'ijnaoe',
};

fs.mkdirSync(OUT, { recursive: true });

for (const [file, slug] of Object.entries(MAP)) {
  const from = path.join(SRC, file);
  if (!fs.existsSync(from)) {
    console.log(`${slug.padEnd(22)} MISSING ${file}`);
    continue;
  }
  const to = path.join(OUT, `${slug}.webp`);
  const meta = await sharp(from).metadata();
  await sharp(from)
    .resize(1000, 750, { fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 82 })
    .toFile(to);
  console.log(
    `${slug.padEnd(22)} ${meta.width}x${meta.height} ${Math.round(fs.statSync(from).size / 1024)} KB -> ${Math.round(fs.statSync(to).size / 1024)} KB`
  );
}
