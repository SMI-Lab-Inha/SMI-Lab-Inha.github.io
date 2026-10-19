import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const headings = [
  'Ultimate Strength', 'Fatigue and Fracture', 'Dynamic Response',
  'Limit States During Accidental and Damage Conditions',
  'Offshore Renewable Energy', 'Structural Assessment During Operations',
];
const legacy = ['ultimate-strength', 'ductile-fracture', 'fatigue-and-eca',
  'peridynamics', 'collision-and-crashworthiness', 'blast-and-explosion',
  'mooring-and-cable-integrity', 'floating-solar', 'virtual-sensing'];

test('six areas, legacy anchors and accepted paper remain connected', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.thrust h3')).toHaveText(headings);
  await expect(page.locator('dl div').filter({ has: page.getByText('Research areas', { exact: true }) }).locator('dd')).toHaveText('6');
  await page.goto('/research/research-areas/');
  await expect(page.locator('.area[id] h2')).toHaveText(headings);
  for (const id of legacy) await expect(page.locator(`[id="${id}"]`)).toHaveCount(1);
  await expect(page.locator('#fatigue-and-fracture')).toContainText('Peridynamics is an emerging method');
  const cables = page.locator('#offshore-renewable-energy .software-highlight');
  await expect(cables.locator('h4')).toHaveText(['CableDyn', 'CableXSec']);
  await expect(cables).toContainText('Private alpha — ongoing development');
  await page.locator('#fatigue-and-fracture a[href*="paper-iacs-wave-scatter-fatigue"]').click();
  const paper = page.locator('#paper-iacs-wave-scatter-fatigue');
  await expect(paper).toContainText('Effect of the revised IACS North Atlantic wave scatter diagram on fatigue damage in ship structures');
  await expect(paper).toContainText('Seo JH');
  await expect(paper).toContainText('Accepted for publication, 19 October 2026');
  await expect(paper.locator('a[href*="doi.org"]')).toHaveCount(0);
  await page.goto('/news/wave-scatter-fatigue-paper-accepted-by-ijnaoe/');
  await page.locator('main a[href*="paper-iacs-wave-scatter-fatigue"]').click();
  await expect(paper).toBeVisible();
});

test('all internal page links and fragments resolve in the build', async ({ page }) => {
  const files = fs.readdirSync('dist', { recursive: true }).map(String).filter(p => p.endsWith('.html') && !/^(google|naver)/.test(p));
  const ids = new Map<string, Set<string>>();
  for (const file of files) {
    const html = fs.readFileSync(path.join('dist', file), 'utf8');
    ids.set(file.replaceAll('\\', '/'), new Set([...html.matchAll(/\bid="([^"]+)"/g)].map(m => m[1])));
  }
  for (const file of files) {
    await page.goto('/' + file.replaceAll('\\', '/').replace(/index\.html$/, ''));
    const targets = await page.locator('a[href]').evaluateAll(links => links.map(a => (a as HTMLAnchorElement).href));
    for (const href of targets) {
      const url = new URL(href);
      if (url.origin !== 'http://127.0.0.1:4321') continue;
      const filePath = decodeURIComponent(url.pathname).replace(/^\//, '');
      const target = filePath.endsWith('.html') ? filePath : filePath.replace(/\/$/, '') + (filePath ? '/' : '') + 'index.html';
      if (!ids.has(target)) {
        expect(fs.existsSync(path.join('dist', filePath)), href).toBeTruthy();
      } else if (url.hash) {
        expect(ids.get(target)!.has(decodeURIComponent(url.hash.slice(1))), href).toBeTruthy();
      }
    }
  }
});

for (const width of [320, 390, 768, 861, 1440]) {
  test(`headings and research navigation fit at ${width}px in both themes`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    for (const route of ['/', '/research/research-areas/', '/research/software/', '/research/projects/']) {
      await page.goto(route);
      for (const theme of ['light', 'dark']) {
        await page.evaluate(t => document.documentElement.dataset.theme = t, theme);
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), route + theme).toBeTruthy();
        const overflowing = await page.locator('main h2, main h3, .thrust').evaluateAll(elements => elements.filter(el => el.scrollWidth > el.clientWidth + 1).map(el => el.textContent));
        expect(overflowing).toEqual([]);
      }
    }
    await page.goto('/');
    if (width < 861) {
      await page.locator('.nav-toggle').click();
      await page.locator('.submenu-toggle').first().click();
    } else await page.locator('.has-children > a').first().hover();
    const submenu = page.locator('.submenu').first();
    for (const heading of headings) {
      await expect(submenu.getByText(heading, { exact: true })).toHaveCount(0);
    }
    await submenu.getByText('Research areas', { exact: true }).click();
    const longLink = page.locator('.jump a[href="#limit-states-during-accidental-and-damage-conditions"]');
    await expect(longLink).toBeVisible();
    const bounds = await longLink.boundingBox();
    expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(width);
    await longLink.click();
    await expect(page.locator('.area[id] h2').nth(3)).toBeInViewport();
  });
}
