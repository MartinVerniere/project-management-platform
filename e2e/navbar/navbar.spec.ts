import { test, expect } from '@playwright/test';
import { resetDatabase, registerUser, loginUser } from '../helpers';

test.describe('Navbar', () => {
	let authToken: string;
	let adminId: number;

	test.beforeEach(async ({ page, request }) => {
		await resetDatabase(request);

		adminId = await registerUser(request, { username: 'john', email: 'john@test.com', password: '12345678' });
		authToken = await loginUser(request, { username: 'john', password: '12345678' });

		await page.goto('/');
		await page.evaluate((authToken) => { localStorage.setItem('authToken', authToken); }, authToken);
		await page.goto('/');
	});

	test('should display navbar basic information and actions', async ({ page }) => {
		const navbar = page.locator('app-navbar');
	
		await expect(navbar.getByRole('link', { name: 'Home' })).toBeVisible();
		await expect(navbar.getByRole('link', { name: 'Projects' })).toBeVisible();
		await expect(navbar.getByText('john')).toBeVisible();
		await expect(navbar.getByRole('button', { name: 'Logout' })).toBeVisible();
	});

	test('should navigate to / on Home button click', async ({ page }) => {
		await page.goto('/projects');

		const navbar = page.locator('app-navbar');

		const homeButton = navbar.getByRole('link', { name: 'Home' });
		await expect(homeButton).toBeVisible();
		await homeButton.click();
	
		await expect(page).toHaveURL('/');
	});

	test('should navigate to /projects on Projects button click', async ({ page }) => {
		const navbar = page.locator('app-navbar');
	
		const projectsButton = navbar.getByRole('link', { name: 'Projects' });
		await expect(projectsButton).toBeVisible();
		await projectsButton.click();
	
		await expect(page).toHaveURL('/projects');
	});

	test('should logout on Logout button click', async ({ page }) => {
		await page.goto('/projects');

		const navbar = page.locator('app-navbar');

		const logoutButton = navbar.getByRole('button', { name: 'Logout' });
		await expect(logoutButton).toBeVisible();
		await logoutButton.click();
	
		const token = await page.evaluate(() => localStorage.getItem('authToken'));
		expect(token).toBeNull();
		await expect(page).toHaveURL('/login');
	});
});
