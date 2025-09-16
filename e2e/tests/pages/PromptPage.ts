import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

export class PromptPage extends BasePage {
  readonly createPromptButton: Locator;
  readonly promptList: Locator;
  readonly searchInput: Locator;
  readonly filterButton: Locator;
  readonly categoryFilter: Locator;
  readonly sortDropdown: Locator;
  readonly promptCard: Locator;
  readonly likeButton: Locator;
  readonly shareButton: Locator;
  readonly editButton: Locator;
  readonly deleteButton: Locator;
  readonly viewMoreButton: Locator;
  
  // Create/Edit prompt modal
  readonly promptTitleInput: Locator;
  readonly promptDescriptionInput: Locator;
  readonly promptContentTextarea: Locator;
  readonly promptCategorySelect: Locator;
  readonly promptTagsInput: Locator;
  readonly savePromptButton: Locator;
  readonly cancelButton: Locator;
  readonly modalOverlay: Locator;

  constructor(page: Page) {
    super(page);
    
    // List page elements
    this.createPromptButton = page.locator('[data-testid="create-prompt-btn"]').first();
    this.promptList = page.locator('[data-testid="prompt-list"]').first();
    this.searchInput = page.locator('input[name="search"]').first();
    this.filterButton = page.locator('[data-testid="filter-btn"]').first();
    this.categoryFilter = page.locator('select[name="category"]').first();
    this.sortDropdown = page.locator('select[name="sort"]').first();
    this.promptCard = page.locator('[data-testid="prompt-card"]');
    this.likeButton = page.locator('[data-testid="like-btn"]').first();
    this.shareButton = page.locator('[data-testid="share-btn"]').first();
    this.editButton = page.locator('[data-testid="edit-btn"]').first();
    this.deleteButton = page.locator('[data-testid="delete-btn"]').first();
    this.viewMoreButton = page.locator('[data-testid="load-more-btn"]').first();
    
    // Modal elements
    this.promptTitleInput = page.locator('form input[name="title"]').first();
    this.promptDescriptionInput = page.locator('form textarea[name="description"]').first();
    this.promptContentTextarea = page.locator('form textarea[name="content"]').first();
    this.promptCategorySelect = page.locator('form select[name="category"]').first();
    this.promptTagsInput = page.locator('form input[name="tags"]').first();
    this.savePromptButton = page.locator('form button[type="submit"]').first();
    this.cancelButton = page.locator('[data-testid="cancel-btn"]').first();
    this.modalOverlay = page.locator('[data-testid="modal"]').first();
  }

  async navigateToPrompts() {
    await this.goto('/prompts');
  }

  async createPrompt(data: {
    title: string;
    description: string;
    content: string;
    category?: string;
    tags?: string[];
  }) {
    await this.createPromptButton.click();
    await this.modalOverlay.waitFor({ state: 'visible' });
    
    await this.promptTitleInput.fill(data.title);
    await this.promptDescriptionInput.fill(data.description);
    await this.promptContentTextarea.fill(data.content);
    
    if (data.category) {
      await this.promptCategorySelect.selectOption(data.category);
    }
    
    if (data.tags && data.tags.length > 0) {
      await this.promptTagsInput.fill(data.tags.join(', '));
    }
    
    await this.savePromptButton.click();
    await this.modalOverlay.waitFor({ state: 'hidden', timeout: 5000 });
  }

  async searchPrompts(query: string) {
    await this.searchInput.fill(query);
    await this.searchInput.press('Enter');
    await this.page.waitForTimeout(1000); // Wait for search results
  }

  async filterByCategory(category: string) {
    await this.categoryFilter.selectOption(category);
    await this.page.waitForTimeout(500);
  }

  async sortBy(sortOption: string) {
    await this.sortDropdown.selectOption(sortOption);
    await this.page.waitForTimeout(500);
  }

  async getPromptCount(): Promise<number> {
    await this.promptList.waitFor({ state: 'visible' });
    return await this.promptCard.count();
  }

  async getPromptByIndex(index: number): Promise<Locator> {
    return this.promptCard.nth(index);
  }

  async getPromptTitle(promptCard: Locator): Promise<string> {
    const title = await promptCard.locator('h2, h3, .prompt-title').textContent();
    return title || '';
  }

  async likePrompt(promptCard: Locator) {
    const likeBtn = promptCard.locator(this.likeButton);
    await likeBtn.click();
    await this.page.waitForTimeout(500);
  }

  async isPromptLiked(promptCard: Locator): Promise<boolean> {
    const likeBtn = promptCard.locator(this.likeButton);
    const classes = await likeBtn.getAttribute('class') || '';
    const ariaPressed = await likeBtn.getAttribute('aria-pressed');
    return classes.includes('liked') || classes.includes('active') || ariaPressed === 'true';
  }

  async getLikeCount(promptCard: Locator): Promise<number> {
    const likeText = await promptCard.locator('.like-count, [data-testid="like-count"]').textContent();
    return parseInt(likeText || '0', 10);
  }

  async editPrompt(promptCard: Locator, updates: {
    title?: string;
    description?: string;
    content?: string;
  }) {
    const editBtn = promptCard.locator(this.editButton);
    await editBtn.click();
    await this.modalOverlay.waitFor({ state: 'visible' });
    
    if (updates.title) {
      await this.promptTitleInput.clear();
      await this.promptTitleInput.fill(updates.title);
    }
    
    if (updates.description) {
      await this.promptDescriptionInput.clear();
      await this.promptDescriptionInput.fill(updates.description);
    }
    
    if (updates.content) {
      await this.promptContentTextarea.clear();
      await this.promptContentTextarea.fill(updates.content);
    }
    
    await this.savePromptButton.click();
    await this.modalOverlay.waitFor({ state: 'hidden', timeout: 5000 });
  }

  async deletePrompt(promptCard: Locator) {
    const deleteBtn = promptCard.locator(this.deleteButton);
    await deleteBtn.click();
    
    // Handle confirmation dialog
    await this.page.locator('button:has-text("확인"), button:has-text("Confirm"), button:has-text("Yes")').click();
    await this.page.waitForTimeout(500);
  }

  async sharePrompt(promptCard: Locator): Promise<string> {
    const shareBtn = promptCard.locator(this.shareButton);
    await shareBtn.click();
    
    // Wait for share modal or copy notification
    await this.page.waitForTimeout(1000);
    
    // Try to get the share URL from clipboard or modal
    const shareUrl = await this.page.evaluate(() => {
      return navigator.clipboard.readText().catch(() => '');
    });
    
    return shareUrl;
  }

  async loadMorePrompts() {
    if (await this.viewMoreButton.isVisible()) {
      await this.viewMoreButton.click();
      await this.page.waitForTimeout(1000);
    }
  }

  async validatePromptForm(): Promise<{
    titleRequired: boolean;
    contentRequired: boolean;
    titleMaxLength: boolean;
    contentMaxLength: boolean;
  }> {
    await this.createPromptButton.click();
    await this.modalOverlay.waitFor({ state: 'visible' });
    
    // Try to submit empty form
    await this.savePromptButton.click();
    
    const titleRequired = await this.page.locator('text=/제목.*필수|title.*required/i').isVisible();
    const contentRequired = await this.page.locator('text=/내용.*필수|content.*required/i').isVisible();
    
    // Check max length
    const longText = 'a'.repeat(1000);
    await this.promptTitleInput.fill(longText);
    const titleMaxLength = (await this.promptTitleInput.inputValue()).length < 1000;
    
    await this.promptContentTextarea.fill('a'.repeat(10000));
    const contentMaxLength = (await this.promptContentTextarea.inputValue()).length < 10000;
    
    await this.cancelButton.click();
    
    return {
      titleRequired,
      contentRequired,
      titleMaxLength,
      contentMaxLength
    };
  }

  async checkInfiniteScroll(): Promise<boolean> {
    const initialCount = await this.getPromptCount();
    
    // Scroll to bottom
    await this.page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await this.page.waitForTimeout(2000);
    
    const newCount = await this.getPromptCount();
    return newCount > initialCount;
  }

  async checkPagination(): Promise<{
    hasPagination: boolean;
    currentPage: number;
    totalPages: number;
  }> {
    const pagination = this.page.locator('.pagination, [data-testid="pagination"]');
    const hasPagination = await pagination.isVisible();
    
    if (!hasPagination) {
      return { hasPagination: false, currentPage: 0, totalPages: 0 };
    }
    
    const currentPage = parseInt(
      await pagination.locator('.current-page, .active').textContent() || '1'
    );
    
    const totalPages = parseInt(
      await pagination.locator('.total-pages, [data-testid="total-pages"]').textContent() || '1'
    );
    
    return { hasPagination, currentPage, totalPages };
  }
}