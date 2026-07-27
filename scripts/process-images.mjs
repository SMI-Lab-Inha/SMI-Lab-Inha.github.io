import sharp from 'sharp';
import fs from 'node:fs';
import path from 'node:path';

const SRC = 'D:/0_administrative/Lab_materials';
const OUT = 'D:/repos/smil_homepage/public/images';

fs.mkdirSync(path.join(OUT, 'members'), { recursive: true });

const members = [
  ['4_Members/임준수.jpg', 'jun-soo-lim'],
  ['4_Members/심규성.jpg', 'kyusung-shim'],
  ['4_Members/송진우.jpg', 'jinwoo-song'],
  ['4_Members/이우진.jpg', 'woojin-lee'],
  ['4_Members/황준혁.jpg', 'jun-hyeok-hwang'],
  ['4_Members/이희원.jpg', 'hui-won-lee'],
];

const results = [];

async function emit(label, out, promise) {
  await promise;
  const kb = Math.round(fs.statSync(out).size / 1024);
  results.push(`${label.padEnd(34)} ${kb} KB`);
}

// Member portraits: 3:4, cover, attention-weighted crop so faces survive.
for (const [rel, slug] of members) {
  const out = path.join(OUT, 'members', `${slug}.webp`);
  await emit(
    `members/${slug}.webp`,
    out,
    sharp(path.join(SRC, rel))
      .resize(480, 640, { fit: 'cover', position: sharp.strategy.attention })
      .webp({ quality: 82 })
      .toFile(out)
  );
}

// Director portrait
{
  const out = path.join(OUT, 'director.webp');
  await emit(
    'director.webp',
    out,
    sharp(path.join(SRC, '5_LaTeX_templates/lab-promo-materials/professor_photo.jpg'))
      .resize(600, 800, { fit: 'cover', position: sharp.strategy.attention })
      .webp({ quality: 84 })
      .toFile(out)
  );
}

// Favicons from the dedicated favicon artwork
for (const size of [32, 180]) {
  const out = path.join(OUT, `favicon-${size}.png`);
  await emit(
    `favicon-${size}.png`,
    out,
    sharp(path.join(SRC, '3_Logo/Favicon/SMI_Lab_favicon.png'))
      .resize(size, size, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } })
      .png({ compressionLevel: 9 })
      .toFile(out)
  );
}

// Header mark (2x of the 44px slot)
{
  const out = path.join(OUT, 'icon-88.png');
  await emit(
    'icon-88.png',
    out,
    sharp(path.join(SRC, '3_Logo/Favicon/SMI_Lab_favicon.png'))
      .resize(88, 88, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } })
      .png({ compressionLevel: 9 })
      .toFile(out)
  );
}

// Open Graph card: 1200x630 on white, logo centred
{
  const out = path.join(OUT, 'og-banner.png');
  const logo = await sharp(path.join(SRC, '3_Logo/Banner.png'))
    .resize(1000, 500, { fit: 'inside' })
    .toBuffer();
  await emit(
    'og-banner.png',
    out,
    sharp({
      create: { width: 1200, height: 630, channels: 4, background: '#ffffff' },
    })
      .composite([{ input: logo, gravity: 'centre' }])
      .png({ compressionLevel: 9 })
      .toFile(out)
  );
}

console.log(results.join('\n'));
