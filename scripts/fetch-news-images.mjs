// One-off: pulls the News images off the old Google Site and stores them locally
// as WebP. Hotlinking lh3.googleusercontent.com would break the moment the
// Google Site is taken down, so the images are copied into the repo instead.
import sharp from 'sharp';
import fs from 'node:fs';
import path from 'node:path';

const OUT = 'public/images/news';
fs.mkdirSync(OUT, { recursive: true });

const B = 'https://lh3.googleusercontent.com/sitesv/';

const items = [
  ['website-update', 'AG8ngQWY1VTn58Gp2zrqzxltIX135MsDcNNvliXjFOa-bA3BG4XOJ_cEjT5dorKkdy8Fa0kvqk-WbbmknHn6vLE_2L_ISBzkDiW3f3dx_Cp6rOd8cyfIH1P1t1R6AnXzJEt_MN2-EuqdYEHzgokgy7Jq1ui8HWKSuGc9mPftDSr7XI2qhHmIfdXynzIKwGbs1P4=w1280'],
  ['ijnaoe', 'AG8ngQXas5pFdNC6M43bFiYdSfql9eCDKs_OfvQZvw3hcoaoAwzIXMemJfCJsVr8bI3Y6FFFeTrw34tHsrrYp52IUImJPdcHJXGygUZ_tQur4q_sh060_lo0JkLdAidk0NwfaZhYYwD0YFUVZw2clG0viqQuj6wbyUn6yA7JmWLOUIqGNpWXSKkWDbd_kahElnROYZUbdUVKmxkibDfTrmHtbPNIQPG15w7A047u9V3eMZs=w1280'],
  ['generic', 'AG8ngQU9q7Kplg0ogWwTABVzAzhyLCgPvgbOGpf7qwMDACxfBIZetaizcpHs7rUwS7R-d6B8yjMy_cwUp1GQjqJqe2xUQKtZjQMDhVVofxUD1y-pjnobmoLNWKGaT-75hr0jWt1U0YZupa8WYJN_R0Uc4a6ewtYPQDMlIbCLBAFVn_ZhzTLY9q74Lx9AnE42QJ2TXnVSg4iuC9VHRpOn6g8n6-wYgn_rNODAGtTT4AiWu8Y=w1280'],
  ['member-woojin-lee', 'AG8ngQWYOyyfB-LGpbduAsRKnxp-wM2ZESPSTHkFswI5qBKQZZppr8z09MM4qQU7r_wp0uKrQxh29hBTBJUqSGYIPNDX2anHk1mj9B7MRevtjGkJrd7atcSP4uGSnAvGFZCJkIrtWpkjDH6162vcyLQJynKD_Q5ei1o4Qhs4xGXOMaCuD3fAjEEI7fjkt8zhabeglaaYOT3El38skfzFtGlbfDWRouVCBlhUBBl6-k0W=w1280'],
  ['member-kyusung-shim', 'AG8ngQVbPAOYgCLiVKRrk-EYVNx7lgKXsAtTaVbdA7TyQ0OZy3yd6v4Yw6E7MMl_zjSkZCG8YU58VjshRp7J7z0-700H7CZ2-3dF1aD3DcxP2u1HBy0f-lHztXOhvup0hI8Z6t5VjZc6eAU7mtFmN94hjWwurfIarE7_ueeA9mln__2D9Z1PdQ7snZA0xawjVdjhPE7yBYYJmIIIlbAXBwxc4dkLRx2JDkqlZKDBMA=w1280'],
  ['jmse-special-issue', 'AG8ngQUXOM8tUJ0MLm83-9AvA9JbPk8gfCTIcX-npp_b1tZ0pRS2BwJ-mTAG8Hqj0CW_C2l3KXzR0GHYD0s_MmAererwR_K3oEypJ9CPsu5-2Vm4gg4uogT1MhEif6kqPX7c_bqX5udxENweuo-JtRSHTyPHu-bPbNwSIct33ybTBgzN7AOnjCHzoYT0R5kfWH56PYk4Qr1-ql1fAaST5Reum4UZBzvfJE2Hj3hvt2tE=w1280'],
  ['member-jun-soo-lim', 'AG8ngQW_d4AAgz_-6uKgFk1WbthiPuSlW8oAZFm18WtpalkxojYO_5NR9Uw7fHuM6JRpJrwOsewKAEI5DiJK7F7DyC8qk5UtWA5SW7-Fr6G38FVHwCgVXYi_npq75LcIw3iNizP2zZo8bw6k53Dub-hkpdIF_d_DixTKRRU9uX9Ar9Qc7QPP4CkUYQHJiB8vPxUmZy59xHbo5na_jwMKw-zhpnwPCf4Tf8_3bxbEWCv006s=w1280'],
  ['issc-2025', 'AG8ngQVZMOaa5FLYelXwXH4X7zPRbMaHMLFjE_cnf1ItvpQMxaiMQ_sKxVdnehZSk6ABhkzGlFJ1sxQcJ9dFNeASMqrtOrTchzOvYje5O4iBPYen_ecCnOeUnYPZja02slCaxyM9TZBG5QMII6_ATGqzW7khaGrUO1RmzBbCE-eqUjK_8G8FQcEhZrxol1ZIPeutieMId9e3J66NCrDwgt2Ww0biFILVlhUBBl6-k0W=w1280'],
  ['madex-2025', 'AG8ngQUSHA2wPL3NgZ1xXZ9uEr1u6zhdf1EDT2ZrYbVTpyjH-tmFBrrmSGntRbBRND4Eg_hscvz9bunOu2ZFxTBtGJuooML6MiXbYM34Zz83dZcaBGH2OnmfRPBw6rt9-8h4_XD8833P1rtS6179h-J5FZRdabBb2QM8027ITETuo2K4Df5BFSLYH11hADLzAnXIKcXwsJwHTg2uV70rmfDikDylOKRAqjpTf8bPYoQ4A1k=w1280'],
  ['ksoe-2025', 'AG8ngQWGWHEWezkzcGhwlRgjRHagYsbwbJN-7ooS4iAosavJ4WHIHrczMtwZ-ulR6ocV6TVaOMOeHTEUJF7Cc3RW7PrX41EFHaDz7BuW8l4Xrh0qKqXuFRp3VAxO4_pXnCzMqIT5ukuqFif__WnLNnWpd9jPmMsqn3SSYHjNNZ2SWVRQvUVkrL3u9D6Pd9OnTH7Yxu_xjDs-mAGb98UWWx3NN6Ws8ku1Noj4AYbG46f2yG8=w1280'],
  ['inha-interview', 'AG8ngQXIyWyAnf_GSXSQLZwB5c_Httw8UHCpx6H40YyPHAdxCczagjPfxWeUq2x2j3iIy4zwoto1fvOaHgC5BEiopkzSq2zx2DHg8usBWTDQtALZ9CFKwS87Wl19b_6jZxQQR1ED4zesz8Tyh_ttjo8A0fLZiXlm4O91_HHp7wc0CL5Wz2pCo9STGKph3w59wD9kiO0UkHrgqAODuUTyIU9ed-P3t69jkz-3A1yZTn17qFg=w1280'],
  ['arirang-tv', 'AG8ngQW6wyLelUgERU6btIf7Ag4APzo0IIxW-2Ut8H4rrRWFxl2gUKwXt3YcDcfnm5_R01UEHJLJX69vG1VKx7M0GL9R3HSCKopK9FBJgoXmXcdR9ZDkQcBTYu6O7GsPELzt3ikb8ajSWVv-sUpNQwOXA4jKYl2xJ5Wi8whuxUm1LyYHyXmOvqDxfZPxrMXWTmMwYnzssQUjl7tMd0fXPQkYiIKbgpZRzRELZOqA4n3d=w1280'],
  ['snakzine', 'AG8ngQXdtSnjyDlXQkpCpeGhFiJMbWE8C50MTRk80G7gnR2XHY-GCQ61GPLZf379CNusZRRWz31hq1Oe7P0DdUQWD9cW9Q-vTX8dSlrKNpsE8SbCntr7KlfxVymKl1eRBYfSEXXBCx5eVttPANTNQiGQEhHsXEQOYRotKgQKWh-o2WZr7hd5TONivx0FXNPcvYeY7j3qkRmu4NyFkMW5PFUSoD3Oo2HlsCA3QPg1PXge=w1280'],
];

for (const [slug, id] of items) {
  const res = await fetch(B + id, {
    headers: {
      // Google's CDN rejects requests that do not look like a browser.
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0 Safari/537.36',
      Referer: 'https://sites.google.com/',
      Accept: 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8',
    },
  });
  if (!res.ok) {
    console.log(`${slug.padEnd(22)} FAILED ${res.status}`);
    continue;
  }
  const buf = Buffer.from(await res.arrayBuffer());
  const out = path.join(OUT, `${slug}.webp`);
  const meta = await sharp(buf).metadata();
  await sharp(buf).resize(900, null, { withoutEnlargement: true }).webp({ quality: 80 }).toFile(out);
  console.log(
    `${slug.padEnd(22)} ${meta.width}x${meta.height} -> ${Math.round(fs.statSync(out).size / 1024)} KB`
  );
}
