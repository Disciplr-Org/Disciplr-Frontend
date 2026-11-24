import { test, expect, connectDemoAccount } from './fixtures/test';

test.describe('Notifications filtering and clear-all journey', () => {
  test('filters unread notifications and clears all with confirmation', async ({
    page,
  }) => {
    await connectDemoAccount(page);

    await page.goto('/notifications');
    await expect(page.getByText('Notification Page')).toBeVisible();

    // Open filter panel and filter by Unread
    const filterButton = page.getByRole('button', { name: /filter notifications/i });
    await expect(filterButton).toBeVisible();
    await filterButton.click();

    const readStatusSelect = page.getByRole('combobox').first();
    await expect(readStatusSelect).toBeVisible();
    await readStatusSelect.selectOption('0');

    // Live status region reflects active unread filter
    const liveStatus = page.getByRole('status').filter({ hasText: /Active filters: status unread/i });
    await expect(liveStatus).toHaveCount(1);

    // Clear all notifications via confirmation modal
    await page.getByRole('button', { name: /^clear all$/i }).click();

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await expect(
      dialog.getByRole('heading', { level: 2, name: /clear all notifications/i }),
    ).toBeVisible();

    await dialog.getByRole('button', { name: /^clear all$/i }).click();
    await expect(dialog).not.toBeVisible();

    // Empty state is visible after clearing all notifications
    await expect(page.getByText('No notifications found.')).toBeVisible();
  });
});
