import { test, expect, connectDemoAccount } from './fixtures/test';

test.describe('API outage and recovery journey', () => {
  test('shows connectivity banner on 500 and refetches vaults on recovery', async ({
    page,
    fakeApi,
  }) => {
    await connectDemoAccount(page);

    // Force the next /vaults request to fail with HTTP 500
    fakeApi.failNext(500, { path: '/vaults' });

    await page.goto('/vaults');

    // ConnectivityBanner renders with role="status" when API returns 500
    const outageBanner = page
      .getByRole('status')
      .filter({ hasText: /Disciplr service is unavailable/i });
    await expect(outageBanner).toBeVisible();

    // Vault list is not yet populated due to the 500
    await expect(
      page.getByRole('link', { name: /Seed Active Vault/i }),
    ).toHaveCount(0);

    // Trigger recovery via the banner's "Retry now" button (GET /health -> 200)
    await outageBanner.getByRole('button', { name: /retry now/i }).click();

    // Banner clears and useOnRecovered refetches the vaults list
    await expect(outageBanner).toBeHidden();
    await expect(
      page.getByRole('link', { name: /Seed Active Vault/i }),
    ).toBeVisible();
  });
});
