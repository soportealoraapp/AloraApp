import { test, expect } from '@playwright/test';

test.describe('Alora v3.6.0 QA Automation - Signup & Onboarding', () => {
    test('Complete 4-step registration flow', async ({ page }) => {
        await page.goto('/signup');

        // Step 1: Basic Info
        await expect(page.getByText('Cuéntanos sobre ti')).toBeVisible();
        await page.fill('input[id="displayName"]', 'QA Test User');
        await page.fill('input[id="age"]', '25');
        await page.click('#gender');
        await page.click('text=Mujer');
        await page.click('#seeking');
        await page.click('text=Hombres');

        // Verify visibility and premium feel logic
        const continuBtn = page.getByRole('button', { name: 'Continuar' });
        await expect(continuBtn).toBeEnabled();
        await continuBtn.click();

        // Step 2: Interests (Assume StepInterests follows)
        await expect(page.getByText('Tus intereses')).toBeVisible();
        await page.click('text=Viajes');
        await page.click('text=Música');
        await page.getByRole('button', { name: 'Continuar' }).click();

        // Step 3: Photos
        await expect(page.getByText('Tus fotos')).toBeVisible();
        // Simulate photo upload (Mocking if necessary, but ideally real check)
        await page.getByRole('button', { name: 'Continuar' }).click();

        // Step 4: Verification
        await expect(page.getByText('Verificación')).toBeVisible();
        await page.click('text=Lo haré más tarde');

        // Final Redirection
        await expect(page).toHaveURL(/\/discover/);
    });
});

test.describe('Premium & Security Audit', () => {
    test('Premium Feature Gate - Sudden Click Protection', async ({ page }) => {
        await page.goto('/qa'); // Use QADashboard for faster verification
        await page.click('text=Premium Gate');

        const unlockBtn = page.getByRole('button', { name: /Desbloquear Premium/i });

        // Rapid Clicks (>5/sec)
        for (let i = 0; i < 6; i++) {
            await unlockBtn.click({ force: true });
        }

        await expect(page.getByText('¡Demasiados intentos!')).toBeVisible();
        await expect(page.locator('.animate-shake')).toBeVisible();
    });
});

test.describe('Wellbeing & Consistency', () => {
    test('Social Battery Transitions', async ({ page }) => {
        await page.goto('/qa');
        await page.click('text=Wellbeing');

        // Low level
        await page.click('text=Low (10%)');
        await expect(page.getByText('Recharge Necessary')).toBeVisible();
        await expect(page.locator('.animate-pulse')).toBeVisible();

        // High level
        await page.click('text=Full (90%)');
        await expect(page.getByText('Status Healthy')).toBeVisible();
    });
});
