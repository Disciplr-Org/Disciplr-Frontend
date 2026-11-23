import { test, expect, connectDemoAccount } from './fixtures/test';

test.describe('Verifier batch approval journey', () => {
  test('selects two tasks, approves with notes, confirms, and verifies queue & history', async ({
    page,
  }) => {
    await connectDemoAccount(page);

    await page.goto('/verifier/queue');
    await expect(
      page.getByRole('heading', { level: 1, name: /pending validations/i }),
    ).toBeVisible();

    const pendingGroup = page.getByRole('group', { name: 'Pending' });
    await expect(pendingGroup).toBeVisible();

    const initialCountText = await pendingGroup.innerText();
    const initialCountMatch = initialCountText.match(/\d+/);
    expect(initialCountMatch).not.toBeNull();
    const initialCount = Number(initialCountMatch![0]);
    expect(initialCount).toBeGreaterThanOrEqual(2);

    // Select two pending tasks from the queue
    const taskOneName = 'Q3 Development Fund';
    const taskTwoName = 'Community Grant #42';

    await page.getByRole('checkbox', { name: `Select ${taskOneName}` }).check();
    await page.getByRole('checkbox', { name: `Select ${taskTwoName}` }).check();

    const batchBar = page.getByRole('region', { name: 'Batch actions' });
    await expect(batchBar).toContainText('2 selected');

    // Open batch approval confirmation modal
    await batchBar.getByRole('button', { name: /approve selected/i }).click();

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await expect(dialog).toContainText('This action will affect 2 validations.');

    const approvalNotes = 'Batch verified deliverables and release artifacts.';
    await dialog.getByLabel(/verification notes/i).fill(approvalNotes);
    await dialog.getByRole('button', { name: /confirm approve/i }).click();
    await expect(dialog).not.toBeVisible();

    // Queue count decrements from N to N-2 and both tasks leave the queue
    const expectedCount = initialCount - 2;
    await expect(pendingGroup).toContainText(String(expectedCount));
    await expect(page.getByRole('checkbox', { name: `Select ${taskOneName}` })).toHaveCount(0);
    await expect(page.getByRole('checkbox', { name: `Select ${taskTwoName}` })).toHaveCount(0);

    // Navigate to history and verify both approved tasks appear
    await page.getByRole('button', { name: /view history/i }).click();
    await expect(page).toHaveURL(/\/verifier\/history/);
    await expect(
      page.getByRole('heading', { level: 1, name: /validation history/i }),
    ).toBeVisible();

    await expect(page.getByText(taskOneName)).toBeVisible();
    await expect(page.getByText(taskTwoName)).toBeVisible();
    await expect(page.getByText(approvalNotes).first()).toBeVisible();
  });
});
