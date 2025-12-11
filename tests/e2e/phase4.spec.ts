import { test, expect } from '@playwright/test';

test.describe('Phase 4 Monetization', () => {
    test('Subscription Page Render', async ({ page }) => {
        await page.goto('/settings/subscription');
        await expect(page.locator('text=Elige tu experiencia Alora')).toBeVisible();
        await expect(page.locator('text=Alora Free')).toBeVisible();
        await expect(page.locator('text=Alora Premium')).toBeVisible();
    });

    test('Upgrade Prompt in Analytics', async ({ page }) => {
        await page.goto('/profile/analytics');
        // Check for upgrade CTA
        await expect(page.locator('text=¿Quieres insights más profundos?')).toBeVisible();
    });
});
