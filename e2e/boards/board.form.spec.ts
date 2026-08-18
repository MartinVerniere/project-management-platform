import { test, expect } from '@playwright/test';
import { resetDatabase, registerUser, loginUser, createProject, createBoard } from '../helpers';

test.describe('Board form', () => {
	let authToken: string;
	let adminId: number;
	let projectId: number;

	test.beforeEach(async ({ page, request }) => {
		await resetDatabase(request);

		adminId = await registerUser(request, { username: 'john', email: 'john@test.com', password: '12345678' });
		authToken = await loginUser(request, { username: 'john', password: '12345678' });
		projectId = await createProject(request, authToken, { name: 'Project A', key: 'PRA', description: '' });

		await page.goto('/');
		await page.evaluate((authToken) => { localStorage.setItem('authToken', authToken); }, authToken);
	});

	test('should display board form basic information and actions', async ({ page }) => {
		await page.goto(`/projects/${projectId}/boards/create`);

		const boardForm = page.locator('app-board-form');
		await expect(boardForm.getByLabel('Name')).toBeVisible();

		await expect(boardForm.getByRole('button', { name: 'Create board' })).toBeVisible();
		await expect(boardForm.getByRole('button', { name: 'Cancel' })).toBeVisible();
	});

	test('should redirect to /projects/:projectId on cancel', async ({ page }) => {
		await page.goto(`/projects/${projectId}/boards/create`);

		const boardForm = page.locator('app-board-form');
		const cancelButton = boardForm.getByRole('button', { name: 'Cancel' });

		cancelButton.click();

		await expect(page).toHaveURL(`/projects/${projectId}`);
	});

	test('should create project correctly and redirect to /projects on submit', async ({ page }) => {
		await page.goto(`/projects/${projectId}/boards/create`);

		const boardForm = page.locator('app-board-form');
		const nameInput = boardForm.getByLabel('Name');

		await nameInput.fill('Board A');

		const submitButton = boardForm.getByRole('button', { name: 'Create Board' });
		submitButton.click();

		await expect(page).toHaveURL(`/projects/${projectId}`);
		await expect(page.locator('app-board-list').getByText('Board A')).toBeVisible();
	});

	test('should have submit button disabled on invalid form state', async ({ page }) => {
		await page.goto(`/projects/${projectId}/boards/create`);

		const boardForm = page.locator('app-board-form');
		const nameInput = boardForm.getByLabel('Name');

		// await nameInput.fill('Project A');

		const submitButton = boardForm.getByRole('button', { name: 'Create Board' });
		await expect(submitButton).toBeDisabled();
	});
});
