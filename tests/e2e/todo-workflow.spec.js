const { test, expect } = require('@playwright/test');
const { TodoPage } = require('./pages/TodoPage');

test.describe('Todo Workflow', () => {
  let todoPage;

  test.beforeEach(async ({ page }) => {
    todoPage = new TodoPage(page);
    await todoPage.reset();
    await todoPage.goto();
    await todoPage.waitForLoad();
  });

  test('displays the app header', async ({ page }) => {
    await expect(page.locator('h1')).toHaveText('To Do App');
    await expect(page.locator('.App-header p')).toHaveText('Keep track of your tasks');
  });

  test('loads initial items from database', async ({ page }) => {
    const items = page.locator('li');
    await expect(items).toHaveCount(3);
  });

  test('adds a new item', async ({ page }) => {
    await todoPage.addItem('My New Task');
    await expect(page.locator('li').filter({ hasText: 'My New Task' })).toBeVisible();
  });

  test('deletes an item', async ({ page }) => {
    await todoPage.addItem('Item To Delete');
    const item = page.locator('li').filter({ hasText: 'Item To Delete' });
    await expect(item).toBeVisible();

    await todoPage.deleteItem('Item To Delete');
    await expect(item).not.toBeVisible();
  });

  test('marks an item as complete and toggles it back', async ({ page }) => {
    await todoPage.addItem('Task To Complete');

    await todoPage.toggleItem('Task To Complete');
    const item = page.locator('li').filter({ hasText: 'Task To Complete' });
    await expect(item).toHaveClass(/completed/);

    await todoPage.toggleItem('Task To Complete');
    await expect(item).not.toHaveClass(/completed/);
  });

  test('edits an item name', async ({ page }) => {
    await todoPage.addItem('Original Name');
    await todoPage.editItem('Original Name', 'Updated Name');

    await expect(page.locator('li').filter({ hasText: 'Updated Name' })).toBeVisible();
    await expect(page.locator('li').filter({ hasText: 'Original Name' })).not.toBeVisible();
  });

  test('filters items by active and completed', async ({ page }) => {
    await todoPage.addItem('Active Task');
    await todoPage.addItem('Done Task');
    await todoPage.toggleItem('Done Task');

    await todoPage.setFilter('Active');
    await expect(page.locator('li').filter({ hasText: 'Active Task' })).toBeVisible();
    await expect(page.locator('li').filter({ hasText: 'Done Task' })).not.toBeVisible();

    await todoPage.setFilter('Completed');
    await expect(page.locator('li').filter({ hasText: 'Done Task' })).toBeVisible();
    await expect(page.locator('li').filter({ hasText: 'Active Task' })).not.toBeVisible();

    await todoPage.setFilter('All');
    await expect(page.locator('li').filter({ hasText: 'Active Task' })).toBeVisible();
    await expect(page.locator('li').filter({ hasText: 'Done Task' })).toBeVisible();
  });

  test('displays correct item count', async ({ page }) => {
    const countText = await todoPage.getItemCountText();
    expect(countText).toMatch(/\d+ items? left/);

    await todoPage.addItem('Count Test Item');
    const beforeCount = await todoPage.getItemCountText();

    await todoPage.toggleItem('Count Test Item');
    // Wait for the count text to actually change after the PATCH response
    await page.waitForFunction(
      (before) => document.querySelector('.item-count')?.textContent !== before,
      beforeCount
    );
    const afterCount = await todoPage.getItemCountText();

    expect(beforeCount).not.toBe(afterCount);
  });
});
