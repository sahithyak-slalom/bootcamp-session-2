class TodoPage {
  constructor(page) {
    this.page = page;
  }

  async reset() {
    await this.page.request.post('http://localhost:3030/api/test/reset');
  }

  async goto() {
    await this.page.goto('/');
  }

  async waitForLoad() {
    await this.page.waitForSelector('ul li', { state: 'visible' });
  }

  async addItem(name) {
    await this.page.fill('input[placeholder="Enter item name"]', name);
    await this.page.click('button[type="submit"]');
    await this.page.waitForSelector(`li:has-text("${name}")`, { state: 'visible' });
  }

  async deleteItem(name) {
    const item = this.page.locator('li').filter({ hasText: name });
    await item.locator('.delete-btn').first().click();
  }

  async toggleItem(name) {
    const item = this.page.locator('li').filter({ hasText: name });
    await item.locator('input[type="checkbox"]').click();
  }

  async editItem(name, newName) {
    const item = this.page.locator('li').filter({ hasText: name });
    await item.locator('.edit-btn').click();
    // After clicking Edit the li replaces its text with an input, so locate globally
    const editInput = this.page.locator('.edit-input');
    await editInput.fill(newName);
    await this.page.locator('button', { hasText: 'Save' }).click();
  }

  async setFilter(filterName) {
    await this.page.locator('button.filter-btn', { hasText: filterName }).click();
  }

  async getItemCountText() {
    return this.page.locator('.item-count').textContent();
  }

  async isItemVisible(name) {
    return this.page.locator('li').filter({ hasText: name }).isVisible();
  }

  async isItemCompleted(name) {
    const item = this.page.locator('li').filter({ hasText: name });
    return item.evaluate(el => el.classList.contains('completed'));
  }
}

module.exports = { TodoPage };
