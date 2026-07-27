// Generates the site's technical figures as SVG. Every coordinate is computed or
// placed explicitly, so the geometry is deterministic and the labels sit on the
// features they name. These are engineering schematics, not illustrations.
import fs from 'node:fs';

const OUT = 'public/images/figures';
fs.mkdirSync(OUT, { recursive: true });

const NAVY = '#051766';
const CYAN = '#53AAE2';
const INK = '#2C3E50';
const MUTE = '#7b8b9f';
const LIGHT = '#EAF4FC';
// Matches the site's body face. SVG loaded via <img> cannot reach our webfonts,
// so this resolves to the system Helvetica or Arial, which are metric twins.
const FONT = "'Helvetica Neue', Helvetica, Arial, sans-serif";

const head = (w, h, title, desc) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" role="img" aria-labelledby="figTitle figDesc">
<title id="figTitle">${title}</title><desc id="figDesc">${desc}</desc>
<rect width="${w}" height="${h}" fill="#ffffff"/>
<style>
  .lbl{font:600 12.5px ${FONT};fill:${INK}}
  .sm{font:400 10.5px ${FONT};fill:${MUTE}}
  .ax{font:500 11px ${FONT};fill:${INK}}
  .ttl{font:700 13.5px ${FONT};fill:${INK}}
</style>`;

// Catmull-Rom through explicit control points, so curve features are real.
function spline(ctrl, perSeg = 40) {
  const P = [ctrl[0], ...ctrl, ctrl[ctrl.length - 1]];
  const out = [];
  for (let i = 0; i < P.length - 3; i++) {
    const [p0, p1, p2, p3] = [P[i], P[i + 1], P[i + 2], P[i + 3]];
    for (let j = 0; j < perSeg; j++) {
      const t = j / perSeg;
      const t2 = t * t;
      const t3 = t2 * t;
      out.push([
        0.5 *
          (2 * p1[0] +
            (-p0[0] + p2[0]) * t +
            (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * t2 +
            (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * t3),
        0.5 *
          (2 * p1[1] +
            (-p0[1] + p2[1]) * t +
            (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * t2 +
            (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * t3),
      ]);
    }
  }
  out.push(ctrl[ctrl.length - 1]);
  return out;
}

const toPath = (pts) =>
  pts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' ');

/* ------------------------------------------------------------------ */
/* 1. Lazy-wave dynamic power cable                                     */
/* ------------------------------------------------------------------ */
function lazyWave() {
  const W = 760;
  const H = 460;
  const sea = 130;
  const bed = 372;

  // A lazy-wave runs hang-off -> sag bend -> buoyed hog bend -> touchdown.
  const ctrl = [
    [158, sea + 12],
    [206, 205],
    [268, 268], // sag bend
    [356, 198], // hog bend, lifted by the buoyancy section
    [452, 318],
    [534, bed], // touchdown
  ];

  const pts = spline(ctrl);
  const d = toPath(pts);

  // Extrema read back off the sampled curve rather than assumed.
  const sagZone = pts.filter((p) => p[0] > 190 && p[0] < 320);
  const sag = sagZone.reduce((a, b) => (b[1] > a[1] ? b : a), sagZone[0]);
  const hogZone = pts.filter((p) => p[0] > sag[0] + 25 && p[0] < 440);
  const hog = hogZone.reduce((a, b) => (b[1] < a[1] ? b : a), hogZone[0]);
  const td = ctrl[ctrl.length - 1];

  const hi = pts.indexOf(hog);
  const buoys = [-3, -2, -1, 0, 1, 2, 3].map((k) => pts[hi + k * 7]).filter(Boolean);

  return `${head(
    W,
    H,
    'Lazy-wave dynamic power cable configuration',
    'A subsea power cable running from a floating platform hang-off, down through the sag bend, up over the buoyancy section to the hog bend, and down to the touchdown point on the seabed.'
  )}
<rect x="0" y="${sea}" width="${W}" height="${bed - sea}" fill="${LIGHT}" opacity=".55"/>
<line x1="0" y1="${sea}" x2="${W}" y2="${sea}" stroke="${CYAN}" stroke-width="1.5"/>
<rect x="0" y="${bed}" width="${W}" height="${H - bed}" fill="${INK}" opacity=".07"/>
<line x1="0" y1="${bed}" x2="${W}" y2="${bed}" stroke="${INK}" stroke-width="1.5"/>
<text class="sm" x="10" y="${sea - 8}">Still water level</text>
<text class="sm" x="10" y="${bed + 18}">Seabed</text>

<g stroke="${NAVY}" stroke-width="3" stroke-linecap="round" fill="none">
  <line x1="150" y1="64" x2="150" y2="34"/>
  <line x1="150" y1="64" x2="181" y2="83"/>
  <line x1="150" y1="64" x2="119" y2="83"/>
</g>
<rect x="147" y="64" width="6" height="48" fill="${NAVY}"/>
<circle cx="150" cy="64" r="4.5" fill="${NAVY}"/>
<rect x="98" y="112" width="104" height="20" rx="3" fill="${NAVY}"/>
<rect x="110" y="132" width="12" height="26" fill="${NAVY}" opacity=".7"/>
<rect x="178" y="132" width="12" height="26" fill="${NAVY}" opacity=".7"/>
<text class="sm" x="98" y="24">Floating platform</text>

<path d="${d}" fill="none" stroke="${NAVY}" stroke-width="2.8" stroke-linecap="round"/>
<line x1="${td[0]}" y1="${bed}" x2="${W - 24}" y2="${bed}" stroke="${NAVY}" stroke-width="2.8"/>

${buoys
  .map(
    (p) =>
      `<rect x="${(p[0] - 6).toFixed(1)}" y="${(p[1] - 5).toFixed(1)}" width="12" height="10" rx="2.5" fill="${CYAN}"/>`
  )
  .join('\n')}

<g stroke="${INK}" stroke-width="1" stroke-dasharray="3 3" opacity=".6">
  <line x1="${sag[0].toFixed(1)}" y1="${sag[1].toFixed(1)}" x2="${sag[0].toFixed(1)}" y2="${(sag[1] + 40).toFixed(1)}"/>
  <line x1="${hog[0].toFixed(1)}" y1="${hog[1].toFixed(1)}" x2="${hog[0].toFixed(1)}" y2="${(hog[1] - 34).toFixed(1)}"/>
  <line x1="${td[0]}" y1="${bed}" x2="${td[0]}" y2="${bed - 56}"/>
</g>
<circle cx="${sag[0].toFixed(1)}" cy="${sag[1].toFixed(1)}" r="4.5" fill="${INK}"/>
<circle cx="${hog[0].toFixed(1)}" cy="${hog[1].toFixed(1)}" r="4.5" fill="${INK}"/>
<circle cx="${td[0]}" cy="${bed}" r="4.5" fill="${INK}"/>
<text class="lbl" text-anchor="middle" x="${sag[0].toFixed(1)}" y="${(sag[1] + 56).toFixed(1)}">Sag bend</text>
<text class="lbl" text-anchor="middle" x="${hog[0].toFixed(1)}" y="${(hog[1] - 54).toFixed(1)}">Hog bend</text>
<text class="sm" text-anchor="middle" x="${hog[0].toFixed(1)}" y="${(hog[1] - 40).toFixed(1)}">buoyancy modules</text>
<text class="lbl" text-anchor="middle" x="${td[0]}" y="${bed - 64}">Touchdown</text>
<text class="lbl" x="212" y="156">Hang-off</text>

<text class="ttl" x="18" y="${H - 26}">Lazy-wave dynamic power cable</text>
<text class="sm" x="18" y="${H - 10}">Fatigue concentrates at the sag and hog bends and in the touchdown zone</text>
</svg>`;
}

/* ------------------------------------------------------------------ */
/* 2. Hull girder progressive collapse                                  */
/* ------------------------------------------------------------------ */
function momentCurvature() {
  const W = 640;
  const H = 420;
  const L = 76;
  const R = W - 34;
  const T = 64;
  const B = H - 74;

  // Smith-method style response: elastic, softening to an ultimate moment,
  // then post-collapse unloading as compressed panels shed load.
  const f = (k) => {
    if (k <= 0.75) return k;
    const a = k - 0.75;
    const rise = 0.55 * (1 - Math.exp(-3.1 * a));
    const shed = 0.3 * Math.pow(Math.max(0, k - 1.6), 1.6);
    return Math.max(0, Math.min(1.3, 0.75 + rise) - shed);
  };

  const KMAX = 3.2;
  const MMAX = 1.5;
  const px = (k) => L + (k / KMAX) * (R - L);
  const py = (m) => B - (m / MMAX) * (B - T);

  const pts = [];
  for (let i = 0; i <= 400; i++) {
    const k = (i / 400) * KMAX;
    pts.push([px(k), py(f(k))]);
  }

  let ku = 0;
  let mu = 0;
  for (let i = 0; i <= 400; i++) {
    const k = (i / 400) * KMAX;
    if (f(k) > mu) {
      mu = f(k);
      ku = k;
    }
  }

  const gx = [0, 1, 2, 3];
  const gy = [0, 0.5, 1.0, 1.5];

  return `${head(
    W,
    H,
    'Hull girder moment–curvature response',
    'Bending moment against curvature for a stiffened hull cross-section, showing the elastic range, first yield, the ultimate moment, and post-collapse softening.'
  )}
${gx.map((v) => `<line x1="${px(v)}" y1="${T}" x2="${px(v)}" y2="${B}" stroke="${INK}" stroke-width=".5" opacity=".14"/>`).join('\n')}
${gy.map((v) => `<line x1="${L}" y1="${py(v)}" x2="${R}" y2="${py(v)}" stroke="${INK}" stroke-width=".5" opacity=".14"/>`).join('\n')}

<line x1="${L}" y1="${B}" x2="${R}" y2="${B}" stroke="${INK}" stroke-width="1.4"/>
<line x1="${L}" y1="${T}" x2="${L}" y2="${B}" stroke="${INK}" stroke-width="1.4"/>
${gx.map((v) => `<text class="sm" text-anchor="middle" x="${px(v)}" y="${B + 18}">${v}</text>`).join('\n')}
${gy.map((v) => `<text class="sm" text-anchor="end" x="${L - 8}" y="${py(v) + 4}">${v.toFixed(1)}</text>`).join('\n')}
<text class="ax" text-anchor="middle" x="${(L + R) / 2}" y="${B + 40}">Curvature  κ / κ_y</text>
<text class="ax" text-anchor="middle" transform="translate(22 ${(T + B) / 2}) rotate(-90)">Bending moment  M / M_y</text>

<line x1="${L}" y1="${py(mu)}" x2="${px(ku)}" y2="${py(mu)}" stroke="${NAVY}" stroke-width="1" stroke-dasharray="4 3" opacity=".5"/>
<path d="${toPath(pts)}" fill="none" stroke="${NAVY}" stroke-width="2.8"/>

<circle cx="${px(0.75)}" cy="${py(0.75)}" r="4.5" fill="${CYAN}"/>
<line x1="${px(0.75)}" y1="${py(0.75)}" x2="${px(0.75) - 8}" y2="${py(0.75) + 44}" stroke="${INK}" stroke-width="1" opacity=".55"/>
<text class="lbl" text-anchor="end" x="${px(0.75) + 16}" y="${py(0.75) + 58}">First yield</text>

<circle cx="${px(ku)}" cy="${py(mu)}" r="5" fill="${NAVY}"/>
<line x1="${px(ku)}" y1="${py(mu)}" x2="${px(ku) + 34}" y2="${py(mu) - 30}" stroke="${INK}" stroke-width="1" opacity=".55"/>
<text class="lbl" x="${px(ku) + 38}" y="${py(mu) - 32}">Ultimate moment  M_u</text>

<text class="sm" text-anchor="middle" x="${px(0.34)}" y="${py(0.62)}">elastic</text>
<text class="sm" text-anchor="middle" x="${px(2.6)}" y="${py(0.5)}">panels shed load</text>

<text class="ttl" x="18" y="${H - 26}">Hull girder progressive collapse</text>
<text class="sm" x="18" y="${H - 10}">Incremental curvature response of a stiffened cross-section</text>
</svg>`;
}

/* ------------------------------------------------------------------ */
/* 3. Ductile fracture locus                                            */
/* ------------------------------------------------------------------ */
function fractureLocus() {
  const W = 640;
  const H = 420;
  const L = 80;
  const R = W - 34;
  const T = 64;
  const B = H - 74;

  // Fracture strain falling with stress triaxiality, after the form of a
  // Hosford–Coulomb locus calibrated for shipbuilding steel.
  const f = (n) => 0.2 + 1.3 * Math.exp(-2.6 * n);

  const NMAX = 1.0;
  const EMAX = 1.6;
  const px = (n) => L + (n / NMAX) * (R - L);
  const py = (e) => B - (e / EMAX) * (B - T);

  const pts = [];
  for (let i = 0; i <= 300; i++) {
    const n = (i / 300) * NMAX;
    pts.push([px(n), py(f(n))]);
  }

  // dx/dy are set per state so the four leaders and labels never collide.
  const states = [
    [0.0, 'Pure shear', 26, -38],
    [1 / 3, 'Uniaxial tension', 26, -38],
    [0.577, 'Plane strain', -26, 40],
    [2 / 3, 'Equibiaxial', 40, 58],
  ];

  const gx = [0, 0.25, 0.5, 0.75, 1.0];
  const gy = [0, 0.4, 0.8, 1.2, 1.6];

  return `${head(
    W,
    H,
    'Ductile fracture locus for shipbuilding steel',
    'Equivalent plastic strain to fracture falling as stress triaxiality increases, annotated with the pure shear, uniaxial tension, plane strain and equibiaxial stress states.'
  )}
${gx.map((v) => `<line x1="${px(v)}" y1="${T}" x2="${px(v)}" y2="${B}" stroke="${INK}" stroke-width=".5" opacity=".14"/>`).join('\n')}
${gy.map((v) => `<line x1="${L}" y1="${py(v)}" x2="${R}" y2="${py(v)}" stroke="${INK}" stroke-width=".5" opacity=".14"/>`).join('\n')}

<path d="${toPath(pts)} L ${px(NMAX)} ${B} L ${L} ${B} Z" fill="${LIGHT}" opacity=".75"/>

<line x1="${L}" y1="${B}" x2="${R}" y2="${B}" stroke="${INK}" stroke-width="1.4"/>
<line x1="${L}" y1="${T}" x2="${L}" y2="${B}" stroke="${INK}" stroke-width="1.4"/>
${gx.map((v) => `<text class="sm" text-anchor="middle" x="${px(v)}" y="${B + 18}">${v.toFixed(2)}</text>`).join('\n')}
${gy.map((v) => `<text class="sm" text-anchor="end" x="${L - 8}" y="${py(v) + 4}">${v.toFixed(1)}</text>`).join('\n')}
<text class="ax" text-anchor="middle" x="${(L + R) / 2}" y="${B + 40}">Stress triaxiality  η</text>
<text class="ax" text-anchor="middle" transform="translate(26 ${(T + B) / 2}) rotate(-90)">Fracture strain  ε̄f</text>

<path d="${toPath(pts)}" fill="none" stroke="${NAVY}" stroke-width="2.8"/>

${states
  .map(([n, name, dx, dy]) => {
    const x = px(n);
    const y = py(f(n));
    const lx = x + dx;
    const ly = y + dy;
    const anchor = dx < 0 ? 'end' : 'start';
    return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="4.5" fill="${CYAN}"/>
<line x1="${x.toFixed(1)}" y1="${y.toFixed(1)}" x2="${lx.toFixed(1)}" y2="${ly.toFixed(1)}" stroke="${INK}" stroke-width="1" opacity=".55"/>
<text class="lbl" text-anchor="${anchor}" x="${(lx + (dx < 0 ? -4 : 4)).toFixed(1)}" y="${(ly + (dy < 0 ? -2 : 12)).toFixed(1)}">${name}</text>`;
  })
  .join('\n')}

<text class="sm" text-anchor="middle" x="${px(0.2)}" y="${py(0.35)}">no fracture</text>

<text class="ttl" x="18" y="${H - 26}">Ductile fracture locus</text>
<text class="sm" x="18" y="${H - 10}">Strain to fracture falls sharply as stress triaxiality rises</text>
</svg>`;
}

const figs = [
  ['lazy-wave-cable.svg', lazyWave()],
  ['moment-curvature.svg', momentCurvature()],
  ['fracture-locus.svg', fractureLocus()],
];

for (const [name, svg] of figs) {
  fs.writeFileSync(`${OUT}/${name}`, svg);
  console.log(`${name.padEnd(26)} ${Math.round(fs.statSync(`${OUT}/${name}`).size / 1024)} KB`);
}
