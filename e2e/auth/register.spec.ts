import { test, expect } from '@playwright/test';

test.describe('Register', () => {
	test.beforeEach(async ({ request }) => {
		const response = await request.delete('http://localhost:3000/api/test/reset');
		expect(response.ok()).toBeTruthy();
	});

	test('should display the register form', async ({ page }) => {
		await page.goto('/register');

		await expect(page.getByLabel('Username')).toBeVisible();
		await expect(page.getByLabel('Email')).toBeVisible();
		await expect(page.getByLabel('Password')).toBeVisible();
		await expect(page.getByRole('button', { name: 'Register' })).toBeVisible();
	});

	test('should disable Register button when form is empty', async ({ page }) => {
		await page.goto('/register');

		await page.getByLabel('Username').fill('john');
		await page.getByLabel('Email').fill('john@test.com');
		const registerButton = page.getByRole('button', { name: 'Register' });

		await expect(registerButton).toBeDisabled();
	});

	test('should register successfully and navigate to login', async ({ page }) => {
		await page.goto('/register');

		await page.getByLabel('Username').fill('john');
		await page.getByLabel('Email').fill('john@test.com');
		await page.getByLabel('Password').fill('12345678');

		const registerButton = page.getByRole('button', { name: 'Register' });

		await expect(registerButton).toBeVisible();
		await registerButton.click();

		await expect(page).toHaveURL('/login');
	});

	test('should navigate to login page on cancel button click', async ({ page }) => {
		await page.goto('/register');

		const cancelButton = page.getByRole('button', { name: 'Cancel' });

		await expect(cancelButton).toBeVisible();
		await cancelButton.click();

		await expect(page).toHaveURL('/login');
	});
});