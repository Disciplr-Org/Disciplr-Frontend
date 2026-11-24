import { test, expect } from './fixtures/test';

test.describe('Theme persistence journey', () => {
  test('toggling theme persists html[data-theme] across page reload', async ({
    page,
  }) => {
    await page.goto('/');

    const html = page.locator('html');
    const initialTheme = await html.getAttribute('data-theme');
    expect(initialTheme === 'light' || initialTheme === 'dark').toBe(true);

    const targetTheme = initialTheme === 'dark' ? 'light' : 'dark';

    // Cycle the theme toggle until html[data-theme] switches to targetTheme
    const toggleButton = page.getByRole('button', {
      name: /switch to (dark|light|system) mode/i,
    });
    await expect(toggleButton).toBeVisible();

    for (let attempt = 0; attempt < 3; attempt++) {
      const current = await html.getAttribute('data-theme');
      if (current === targetTheme) break;
      await toggleButton.click();
    }

    await expect(html).toHaveAttribute('data-theme', targetTheme);

    // Reload and confirm the chosen theme persists
    await page.reload();
    await expect(html).toHaveAttribute('data-theme', targetTheme);
  });
});
