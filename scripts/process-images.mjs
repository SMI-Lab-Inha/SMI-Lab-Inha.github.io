import sharp from 'sharp';
import fs from 'node:fs';
import path from 'node:path';

const SRC = 'D:/0_administrative/Lab_materials';
const OUT = 'D:/repos/smil_homepage/public/images';

fs.mkdirSync(path.join(OUT, 'members'), { recursive: true });

const members = [
  ['4_Members/임준수.jpg', 'jun-soo-lim'],
  ['4_Members/심규성.jpg', 'kyusung-shim'],
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

/**
 * Open Graph card, 1200x630.
 *
 * Composed as SVG and rasterised once, rather than centring a wordmark on
 * white: a card is a thumbnail in someone's feed, so it needs to say whose lab
 * it is and hold its own against the surrounding white. Navy ground from the
 * Inha livery, the mark on a white panel, the name set beside it.
 *
 * It builds from the committed public/images/logo.svg rather than from the
 * lab materials, so this block runs anywhere the repository is checked out.
 */
{
  const out = path.join(OUT, 'og-banner.png');
  const mark = fs.readFileSync(path.join(OUT, 'logo.svg'), 'utf8');
  const inner = mark.replace(/^[\s\S]*?<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '');
  const card = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#051766"/>
      <stop offset="100%" stop-color="#030d3d"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#g)"/>
  <rect x="0" y="622" width="1200" height="8" fill="#53AAE2"/>
  <g transform="translate(96,172)">
    <rect x="-24" y="-24" width="300" height="300" rx="10" fill="#ffffff"/>
    <g transform="scale(0.246)">${inner}</g>
  </g>
  <g font-family="Helvetica Neue, Helvetica, Arial, sans-serif" fill="#ffffff">
    <text x="456" y="262" font-size="60" font-weight="700" letter-spacing="-1.4">Marine Structural</text>
    <text x="456" y="334" font-size="60" font-weight="700" letter-spacing="-1.4">Mechanics and</text>
    <text x="456" y="406" font-size="60" font-weight="700" letter-spacing="-1.4">Integrity Lab</text>
    <text x="456" y="478" font-size="30" fill="#53AAE2" letter-spacing="2.4">INHA UNIVERSITY</text>
  </g>
</svg>`;
  await emit('og-banner.png', out, sharp(Buffer.from(card)).png({ compressionLevel: 9 }).toFile(out));
}

console.log(results.join('\n'));
