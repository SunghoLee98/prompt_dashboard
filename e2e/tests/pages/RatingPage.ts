import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

export class RatingPage extends BasePage {
  // Rating components
  readonly ratingContainer: Locator;
  readonly ratingStars: Locator;
  readonly averageRatingDisplay: Locator;
  readonly ratingCountDisplay: Locator;
  readonly userRatingDisplay: Locator;
  readonly deleteRatingButton: Locator;
  
  // Feedback messages
  readonly ratingSuccessMessage: Locator;
  readonly ratingUpdateMessage: Locator;
  readonly ratingDeleteMessage: Locator;
  readonly errorMessage: Locator;
  readonly loadingIndicator: Locator;
  
  // Rating display in lists
  readonly promptRatingBadge: Locator;
  readonly ratingStarIcon: Locator;

  constructor(page: Page) {
    super(page);
    
    // Rating components
    this.ratingContainer = page.locator('.rating-container, [data-testid="rating-container"]');
    this.ratingStars = page.locator('.rating-star, [data-testid="rating-star"], button[aria-label*="star"], .star-button');
    this.averageRatingDisplay = page.locator('.average-rating, [data-testid="average-rating"], .rating-value');
    this.ratingCountDisplay = page.locator('.rating-count, [data-testid="rating-count"], .total-ratings');
    this.userRatingDisplay = page.locator('.user-rating, [data-testid="user-rating"], .my-rating');
    this.deleteRatingButton = page.locator('button:has-text("평점 삭제"), button:has-text("Delete Rating"), .delete-rating-btn');
    
    // Feedback messages
    this.ratingSuccessMessage = page.locator('.rating-success, [role="alert"]:has-text("평점"), [role="alert"]:has-text("Rating")');
    this.ratingUpdateMessage = page.locator('.rating-update, [role="alert"]:has-text("수정"), [role="alert"]:has-text("Updated")');
    this.ratingDeleteMessage = page.locator('.rating-delete, [role="alert"]:has-text("삭제"), [role="alert"]:has-text("Deleted")');
    this.errorMessage = page.locator('.error-message, [role="alert"].error, .rating-error');
    this.loadingIndicator = page.locator('.loading, .spinner, [data-testid="loading"]');
    
    // Rating display in lists
    this.promptRatingBadge = page.locator('.rating-badge, .prompt-rating');
    this.ratingStarIcon = page.locator('.star-icon, .rating-icon');
  }

  /**
   * Rate a prompt with the specified score
   * @param score - Rating score from 1 to 5
   */
  async ratePrompt(score: number): Promise<void> {
    if (score < 1 || score > 5) {
      throw new Error('Rating score must be between 1 and 5');
    }
    
    // Click the nth star (0-indexed)
    await this.ratingStars.nth(score - 1).click();
    
    // Wait for the rating to be processed
    await this.page.waitForTimeout(500);
  }

  /**
   * Get the current user's rating for the prompt
   * @returns The user's rating (0 if not rated)
   */
  async getUserRating(): Promise<number> {
    // Check if user has rated by counting active/filled stars
    const activeStars = await this.ratingStars.evaluateAll((stars) => {
      return stars.filter(star => 
        star.classList.contains('active') || 
        star.classList.contains('filled') ||
        star.classList.contains('selected') ||
        star.getAttribute('aria-checked') === 'true'
      ).length;
    });
    
    return activeStars;
  }

  /**
   * Get the average rating displayed
   * @returns The average rating value
   */
  async getAverageRating(): Promise<number> {
    const ratingText = await this.averageRatingDisplay.textContent();
    const match = ratingText?.match(/[\d.]+/);
    return match ? parseFloat(match[0]) : 0;
  }

  /**
   * Get the total number of ratings
   * @returns The rating count
   */
  async getRatingCount(): Promise<number> {
    const countText = await this.ratingCountDisplay.textContent();
    const match = countText?.match(/\d+/);
    return match ? parseInt(match[0]) : 0;
  }

  /**
   * Delete the user's rating
   */
  async deleteRating(): Promise<void> {
    await this.deleteRatingButton.click();
    // Wait for confirmation dialog if present
    await this.page.waitForTimeout(500);
  }

  /**
   * Check if the rating component is interactive (not disabled)
   * @returns True if user can rate, false otherwise
   */
  async canRate(): Promise<boolean> {
    const firstStar = this.ratingStars.first();
    const isDisabled = await firstStar.isDisabled();
    const isVisible = await firstStar.isVisible();
    return isVisible && !isDisabled;
  }

  /**
   * Find a prompt that the user hasn't rated yet
   * @returns Locator for an unrated prompt
   */
  async findUnratedPrompt(): Promise<Locator> {
    // Look for prompts without user rating indicator
    const prompts = this.page.locator('.prompt-card, [data-testid="prompt-card"]');
    const count = await prompts.count();
    
    for (let i = 0; i < count; i++) {
      const prompt = prompts.nth(i);
      const hasUserRating = await prompt.locator('.user-rated-indicator, .my-rating').isVisible();
      
      if (!hasUserRating) {
        return prompt;
      }
    }
    
    // Return first prompt if none found without rating
    return prompts.first();
  }

  /**
   * Get all prompts from the list
   * @returns Array of prompt locators
   */
  async getAllPrompts(): Promise<Locator[]> {
    const prompts = this.page.locator('.prompt-card, [data-testid="prompt-card"]');
    const count = await prompts.count();
    const promptArray: Locator[] = [];
    
    for (let i = 0; i < count; i++) {
      promptArray.push(prompts.nth(i));
    }
    
    return promptArray;
  }

  /**
   * Hover over a star to preview the rating
   * @param starIndex - Index of the star to hover (0-based)
   */
  async hoverStar(starIndex: number): Promise<void> {
    await this.ratingStars.nth(starIndex).hover();
  }

  /**
   * Check if a specific star is highlighted/active
   * @param starIndex - Index of the star to check (0-based)
   * @returns True if the star is active/highlighted
   */
  async isStarActive(starIndex: number): Promise<boolean> {
    const star = this.ratingStars.nth(starIndex);
    const classes = await star.getAttribute('class');
    const ariaChecked = await star.getAttribute('aria-checked');
    
    return (
      classes?.includes('active') ||
      classes?.includes('filled') ||
      classes?.includes('selected') ||
      ariaChecked === 'true'
    ) ?? false;
  }

  /**
   * Wait for rating to be saved
   */
  async waitForRatingSaved(): Promise<void> {
    // Wait for success message or loading to disappear
    await Promise.race([
      this.ratingSuccessMessage.waitFor({ state: 'visible', timeout: 5000 }),
      this.loadingIndicator.waitFor({ state: 'hidden', timeout: 5000 })
    ]);
  }

  /**
   * Get rating display from prompt card in list
   * @param promptCard - The prompt card locator
   * @returns The rating information
   */
  async getPromptCardRating(promptCard: Locator): Promise<{ average: number; count: number }> {
    const ratingElement = promptCard.locator('.rating-display, [data-testid="rating"]');
    const ratingText = await ratingElement.textContent();
    
    // Parse rating text (e.g., "4.5 (23)" or "★ 4.5 · 23 ratings")
    const averageMatch = ratingText?.match(/[\d.]+/);
    const countMatch = ratingText?.match(/\((\d+)\)|\b(\d+)\s*(평점|rating)/i);
    
    return {
      average: averageMatch ? parseFloat(averageMatch[0]) : 0,
      count: countMatch ? parseInt(countMatch[1] || countMatch[2]) : 0
    };
  }

  /**
   * Check if error message is displayed
   * @returns True if error message is visible
   */
  async hasError(): Promise<boolean> {
    return await this.errorMessage.isVisible({ timeout: 1000 });
  }

  /**
   * Get error message text
   * @returns The error message text
   */
  async getErrorMessage(): Promise<string> {
    return await this.errorMessage.textContent() || '';
  }

  /**
   * Clear/reset the current rating selection
   */
  async clearRating(): Promise<void> {
    // Click on the currently selected star again to deselect
    const currentRating = await this.getUserRating();
    if (currentRating > 0) {
      await this.ratingStars.nth(currentRating - 1).click();
    }
  }

  /**
   * Check if the rating component shows a loading state
   * @returns True if loading
   */
  async isLoading(): Promise<boolean> {
    return await this.loadingIndicator.isVisible({ timeout: 500 });
  }

  /**
   * Get all rating-related analytics from the page
   * @returns Object with rating statistics
   */
  async getRatingAnalytics(): Promise<{
    average: number;
    total: number;
    distribution?: { [key: number]: number };
  }> {
    const average = await this.getAverageRating();
    const total = await this.getRatingCount();
    
    // Try to get distribution if available
    const distribution: { [key: number]: number } = {};
    for (let i = 1; i <= 5; i++) {
      const selector = `.rating-distribution-${i}, [data-rating="${i}"]`;
      const element = this.page.locator(selector);
      if (await element.isVisible({ timeout: 500 })) {
        const text = await element.textContent();
        const count = parseInt(text?.match(/\d+/)?.[0] || '0');
        distribution[i] = count;
      }
    }
    
    return {
      average,
      total,
      distribution: Object.keys(distribution).length > 0 ? distribution : undefined
    };
  }
}