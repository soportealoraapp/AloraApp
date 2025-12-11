import { test, expect } from '@playwright/test';

test.describe('Phase 3 AI Features', () => {
    test('Analytics Page Loads', async ({ page }) => {
        // Navigate to analytics (assuming logged in state handled by global setup or reusable auth)
        await page.goto('/profile/analytics');
        await expect(page.locator('text=Love Analytics')).toBeVisible();
        await expect(page.locator('text=Radar de Compatibilidad')).toBeVisible();
    });
});
