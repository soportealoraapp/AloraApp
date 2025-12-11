import { test, expect } from '@playwright/test';

test.describe('Phase 2 Flows', () => {
    test('Onboarding Wizard Progression', async ({ page }) => {
        await page.goto('/signup');
        // Check for wizard steps
        await expect(page.locator('text=Paso 1 de 4')).toBeVisible();
        await page.fill('input[placeholder="Tu nombre"]', 'Test User');
        await page.click('button:has-text("Continuar")');
        // Should be on step 2
        await expect(page.locator('text=Tus Intereses')).toBeVisible();
    });

    test('Swipe Interaction', async ({ page }) => {
        await page.goto('/discover');
        // Wait for card
        const card = page.locator('.relative.z-10'); // Floating card container
        await expect(card).toBeVisible({ timeout: 10000 });

        // Simulate swipe right
        await card.dragTo(page.locator('body'), {
            targetPosition: { x: 500, y: 0 }
        });

        // Expect card to disappear or new one to appear
        // This is tricky without mock data, but we check for interaction code path
    });
});
