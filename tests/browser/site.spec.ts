import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { Cite } from '@citation-js/core';
import '@citation-js/plugin-bibtex';
import papers from '../../src/data/publications.json' with { type: 'json' };
import { citationAuthors } from '../../src/lib/citations.js';

test('publication search and tags display exactly the counted results', async ({ page }) => {
  await page.goto('/publications/journal-papers/');
  const search = page.getByRole('searchbox');
  await search.fill('CableDyn');
  await expect(page.locator('[data-publication]:visible')).toHaveCount(1);
  await expect(page.locator('[data-publication-count]')).toHaveText('1 paper');
  await expect(page.locator('.jump a:visible')).toHaveText(['2026']);
  await search.fill('no-paper-matches-this-query');
  await expect(page.locator('[data-publication]:visible')).toHaveCount(0);
  await expect(page.locator('.jump a:visible')).toHaveCount(0);
  await search.fill('');
  const button = page.locator('.tag-row [data-tag-filter="Ductile fracture"]');
  await button.click();
  const expected = papers.filter((paper) => paper.type === 'journal' && paper.tags.includes('Ductile fracture'));
  await expect(page.locator('[data-publication]:visible')).toHaveCount(expected.length);
  await search.fill('2023');
  await expect(page.locator('[data-publication]:visible')).toHaveCount(expected.filter((paper) => paper.year === '2023').length);
  await search.fill('');
  await button.click();
  await expect(page.locator('[data-publication]:visible')).toHaveCount(papers.filter((paper) => paper.type === 'journal').length);
});

test('downloaded citations retain all author identities and unique keys', async ({ request }) => {
  const response = await request.get('/publications/publications.bib');
  expect(response.ok()).toBeTruthy();
  const bibliography = new Cite(await response.text()).data;
  expect(bibliography).toHaveLength(papers.length);
  expect(new Set(bibliography.map((paper) => paper.id)).size).toBe(papers.length);
  for (const [index, paper] of papers.entries()) {
    expect(bibliography[index].author).toEqual(citationAuthors(paper.authors));
    expect(bibliography[index].title).toBe(paper.title);
  }
  const ris = await (await request.get('/publications/publications.ris')).text();
  expect(ris).toContain('AU  - Seo, J. H.');
  expect(ris).toContain('SP  - 558\nEP  - 566');
});

for (const width of [390, 1440]) {
  test(`navigation disclosures close truthfully at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/');
    if (width < 861) await page.locator('.nav-toggle').click();
    const button = page.locator('.submenu-toggle').first();
    // Keyboard activation avoids a preceding mouse hover opening a desktop menu.
    await button.focus();
    await page.keyboard.press('Enter');
    await expect(button).toHaveAttribute('aria-expanded', 'true');
    await expect(page.locator('.submenu').first()).toBeVisible();
    await page.keyboard.press('Enter');
    await expect(button).toHaveAttribute('aria-expanded', 'false');
    await expect(page.locator('.submenu').first()).toBeHidden();
    await page.keyboard.press('Enter');
    await page.keyboard.press('Escape');
    await expect(page.locator('.submenu').first()).toBeHidden();
    await expect(button).toBeFocused();
    if (width < 861) {
      await page.keyboard.press('Escape');
      await expect(page.locator('#primary-nav')).toBeHidden();
      await expect(page.locator('.nav-toggle')).toBeFocused();
    }
  });
}

test('portrait styles, focus, theme persistence and print are effective', async ({ page, request }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  await page.keyboard.press('Tab');
  await page.keyboard.press('Tab');
  await expect(page.locator('.brand')).toBeFocused();
  await expect(page.locator('.brand')).toHaveCSS('outline-color', 'rgb(255, 255, 255)');
  await expect(page.locator('.people img').first()).toHaveCSS('object-fit', 'cover');
  await expect(page.locator('.people img').first()).toHaveCSS('aspect-ratio', '3 / 4');
  await page.selectOption('#theme-select', 'dark');
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  for (const theme of ['dark', 'light']) {
    await page.selectOption('#theme-select', theme);
    await page.emulateMedia({ media: 'print' });
    await expect(page.locator('.hero h1')).toHaveCSS('color', 'rgb(0, 0, 0)');
    await expect(page.locator('.site-header')).toBeHidden();
    await page.emulateMedia({ media: 'screen' });
  }
  await page.goto('/team/director/');
  const images = await page.locator('script[type="application/ld+json"]').evaluate((script) =>
    (JSON.parse(script.textContent!)['@graph'] as { image?: string }[]).flatMap((node) => node.image ? [new URL(node.image).pathname] : []));
  for (const image of images) expect((await request.get(image)).status()).toBe(200);
});

test('homepage reflows and exposes current activity early', async ({ page }) => {
  for (const width of [320, 375, 390, 768, 860, 861, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/');
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(width);
    expect(await page.locator('.updates').evaluate((element) => element.getBoundingClientRect().top)).toBeLessThan(1100);
  }
});

test('navigation remains available without JavaScript', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  await page.goto('http://127.0.0.1:4321/');
  await expect(page.locator('#primary-nav')).toBeVisible();
  await expect(page.locator('.submenu').first()).toBeVisible();
  await context.close();
});

for (const route of ['/', '/join-us/', '/research/', '/research/research-areas/', '/research/projects/', '/research/software/', '/team/', '/team/director/', '/team/current-members/', '/publications/', '/publications/journal-papers/', '/publications/conference-proceedings/', '/news/', '/links/', '/teaching/']) {
  test(`accessible content and mobile reflow: ${route}`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(route);
    for (const theme of ['light', 'dark']) {
      await page.evaluate((value) => { document.documentElement.dataset.theme = value; }, theme);
      const result = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze();
      expect(result.violations).toEqual([]);
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(390);
    }
    if (route === '/publications/journal-papers/') {
      await page.evaluate(() => { document.documentElement.dataset.theme = 'light'; });
      await page.locator('.nav-toggle').click();
      await page.locator('.submenu-toggle').last().click();
      const expanded = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze();
      expect(expanded.violations).toEqual([]);
    }
  });
}
