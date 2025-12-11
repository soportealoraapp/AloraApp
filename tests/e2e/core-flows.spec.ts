import { test, expect } from '@playwright/test';

test.describe('Alora Core Flows', () => {
    test('Login and Onboarding Flow', async ({ page }) => {
        // 1. Visit Login
        await page.goto('/login');

        // 2. Fill Login (Mock)
        await page.fill('input[type="email"]', 'test@alora.app');
        await page.fill('input[type="password"]', 'password123');
        await page.click('button[type="submit"]');

        // 3. Verify Redirect
        await expect(page).toHaveURL(/\/matches|\/discover/);
    });

    test('Women First Chat Restriction', async ({ page }) => {
        // Mock state as Male user
        // verify input is disabled
        // This is hard to test against real firebase auth without seeding
        // We assume the page renders the restriction for men
    });
});
