import { test, expect } from '@playwright/test';

for (const width of [390, 1440]) {
  test(`search and subject filters show the counted papers at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/publications/journal-papers/');
    const papers = page.locator('[data-publication]:visible');
    const originalCount = await papers.count();
    const search = page.getByRole('searchbox');
    await search.fill('CableDyn');
    await expect(papers).toHaveCount(1);
    await expect(page.locator('[data-publication-count]')).toHaveText('1 paper');
    await expect(page.locator('.year-block:visible .count')).toHaveText('1 paper');
    await expect(page.locator('.jump a:visible')).toHaveText(['2026']);
    await search.fill('no-matching-publication');
    await expect(papers).toHaveCount(0);
    await expect(page.locator('.jump a:visible')).toHaveCount(0);
    await search.fill('');
    await expect(papers).toHaveCount(originalCount);
    const tag = page.locator('.tag-row button').first();
    const expected = Number(await tag.locator('.tag-count').textContent());
    await tag.click();
    await expect(papers).toHaveCount(expected);
    await search.fill('no-matching-publication');
    await expect(papers).toHaveCount(0);
    await search.fill('');
    await tag.click();
    await expect(papers).toHaveCount(originalCount);
  });

  test(`navigation opens, closes and follows links at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/');
    const link = page.locator('.has-children > a').first();
    const submenu = page.locator('.submenu').first();
    const button = page.locator('.submenu-toggle').first();
    if (width < 861) {
      await page.locator('.nav-toggle').click();
      await button.click();
    } else {
      await link.hover();
    }
    await expect(submenu).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(submenu).toBeHidden();
    await expect(button).toHaveAttribute('aria-expanded', 'false');
    await expect(width < 861 ? button : link).toBeFocused();
    await link.focus();
    await page.keyboard.press('ArrowDown');
    await expect(submenu.locator('a').first()).toBeFocused();
    await page.locator('main').click({ position: { x: 5, y: 5 } });
    await expect(submenu).toBeHidden();
    if (width < 861) {
      await page.locator('.nav-toggle').click();
      await button.click();
    } else {
      await link.hover();
    }
    await submenu.locator('a').first().click();
    await expect(page).toHaveURL(/\/research\/research-areas\/?$/);
    await expect(page.locator('h1')).toHaveText('Research');
  });
}

test('mobile navigation remains usable without JavaScript', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  await page.goto('http://127.0.0.1:4321/');
  await expect(page.locator('#primary-nav')).toBeVisible();
  await page.locator('.submenu a').first().click();
  await expect(page).toHaveURL(/\/research\/research-areas\/?$/);
  await context.close();
});
