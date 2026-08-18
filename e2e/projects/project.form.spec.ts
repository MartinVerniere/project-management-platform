import { test, expect } from '@playwright/test';
import { resetDatabase, registerUser, loginUser } from '../helpers';

test.describe('Project form', () => {
	let authToken: string;
	let adminId: number;

	test.beforeEach(async ({ page, request }) => {
		await resetDatabase(request);

		adminId = await registerUser(request, { username: 'john', email: 'john@test.com', password: '12345678' });
		authToken = await loginUser(request, { username: 'john', password: '12345678' });

		await page.goto('/');
		await page.evaluate((authToken) => { localStorage.setItem('authToken', authToken); }, authToken);
	});

	test('should display project form basic information and actions', async ({ page }) => {
		await page.goto('/projects/create');

		const projectForm = page.locator('app-project-form');
		await expect(projectForm.getByLabel('Name')).toBeVisible();
		await expect(projectForm.getByLabel('Key')).toBeVisible();
		await expect(projectForm.getByLabel('Description')).toBeVisible();

		await expect(projectForm.getByRole('button', { name: 'Create project' })).toBeVisible();
		await expect(projectForm.getByRole('button', { name: 'Cancel' })).toBeVisible();
	});

	test('should redirect to /projects on cancel', async ({ page }) => {
		await page.goto('/projects/create');

		const projectForm = page.locator('app-project-form');
		const cancelButton = projectForm.getByRole('button', { name: 'Cancel' });

		cancelButton.click();

		await expect(page).toHaveURL('/projects');
	});

	test('should create project correctly and redirect to /projects on submit', async ({ page }) => {
		await page.goto('/projects/create');

		const projectForm = page.locator('app-project-form');
		const nameInput = projectForm.getByLabel('Name');
		const keyInput = projectForm.getByLabel('Key');
		const descInput = projectForm.getByLabel('Description');

		await nameInput.fill('Project A');
		await keyInput.fill('PRA');
		await descInput.fill('Description')

		const submitButton = projectForm.getByRole('button', { name: 'Create project' });
		submitButton.click();

		await expect(page).toHaveURL('/projects');
		await expect(page.locator('app-project-list').getByText('Project A')).toBeVisible();
	});

	test('should have submit button disabled on invalid form state', async ({ page }) => {
		await page.goto('/projects/create');

		const projectForm = page.locator('app-project-form');
		const nameInput = projectForm.getByLabel('Name');
		const keyInput = projectForm.getByLabel('Key');
		const descInput = projectForm.getByLabel('Description');

		// await nameInput.fill('Project A');
		await keyInput.fill('PRA');
		await descInput.fill('Description')

		const submitButton = projectForm.getByRole('button', { name: 'Create project' });
		await expect(submitButton).toBeDisabled();
	});
});
