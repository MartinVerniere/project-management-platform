import { test, expect } from '@playwright/test';

test.describe('Login', () => {
	test.beforeEach(async ({ request }) => {
		let response = await request.delete('http://localhost:3000/api/test/reset');

		response = await request.post('http://localhost:3000/api/auth/register', {
			data: {
				username: 'john',
				email: 'john@test.com',
				password: '12345678',
			},
		});

		expect(response.ok()).toBeTruthy();
	});

	test('should display the login form', async ({ page }) => {
		await page.goto('/login');

		await expect(page.getByLabel('Username')).toBeVisible();
		await expect(page.getByLabel('Password')).toBeVisible();
		await expect(page.getByRole('button', { name: 'Login' })).toBeVisible();
	});

	test('should disable Login button when form is empty', async ({ page }) => {
		await page.goto('/login');

		await page.getByLabel('Username').fill('john');
		const registerButton = page.getByRole('button', { name: 'Login' });

		await expect(registerButton).toBeDisabled();
	});

	test('should show error with invalid credentials', async ({ page }) => {	
		await page.goto('/login');
	
		await page.getByLabel('Username').fill('john');
		await page.getByLabel('Password').fill('wrong-password');
	
		await page.getByRole('button', { name: 'Login' }).click();
	
		await expect(page.getByText('Invalid username or password')).toBeVisible();
		await expect(page).toHaveURL('/login');
	});

	test('should login successfully and navigate to home', async ({ page }) => {
		await page.goto('/login');

		await page.getByLabel('Username').fill('john');
		await page.getByLabel('Password').fill('12345678');

		const registerButton = page.getByRole('button', { name: 'Login' });

		await expect(registerButton).toBeVisible();
		await registerButton.click();

		await expect(page).toHaveURL('/');
	});

	test('should navigate to register page on register button click', async ({ page }) => {
		await page.goto('/login');
	
		const registerButton = page.getByRole('button', { name: 'Register' });

		await expect(registerButton).toBeVisible();
		await registerButton.click();
	
		await expect(page).toHaveURL('/register');
	});
});