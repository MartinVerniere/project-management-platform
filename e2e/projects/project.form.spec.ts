import { test, expect } from '@playwright/test';

test.describe('Project form', () => {
	let authToken: string;
	let adminId: number;

	test.beforeEach(async ({ page, request }) => {
		const resetResponse = await request.delete('http://localhost:3000/api/test/reset');

		const registerResponse = await request.post('http://localhost:3000/api/auth/register', {
			data: { username: 'john', email: 'john@test.com', password: '12345678' },
		});
		expect(registerResponse.ok()).toBeTruthy();
		const { id: registerAId } = await registerResponse.json();
		adminId = registerAId;

		const loginResponse = await request.post('http://localhost:3000/api/auth/login', {
			data: { username: 'john', password: '12345678' },
		});
		expect(loginResponse.ok()).toBeTruthy();
		const loginResponseJSON = await loginResponse.json();
		authToken = loginResponseJSON.token;

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
