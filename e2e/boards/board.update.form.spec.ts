import { test, expect } from '@playwright/test';
import { resetDatabase, registerUser, loginUser, createProject, createBoard } from '../helpers';

test.describe('Board update form', () => {
	let authToken: string;
	let adminId: number;
	let projectId: number;
	let boardId: number;

	test.beforeEach(async ({ page, request }) => {
		await resetDatabase(request);

		adminId = await registerUser(request, { username: 'john', email: 'john@test.com', password: '12345678' });
		authToken = await loginUser(request, { username: 'john', password: '12345678' });
		projectId = await createProject(request, authToken, { name: 'Project A', key: 'PRA', description: '' });
		boardId = await createBoard(request, authToken, projectId, { name: 'Board A' });

		await page.goto('/');
		await page.evaluate((authToken) => { localStorage.setItem('authToken', authToken); }, authToken);
	});

	test('should display board form basic information (with previous values) and actions', async ({ page }) => {
		await page.goto(`/projects/${projectId}/boards/${boardId}/edit`);

		const boardUpdateForm = page.locator('app-board-update-form');
		const nameInput = boardUpdateForm.getByLabel('Name');
		await expect(nameInput).toBeVisible();
		await expect(nameInput).toHaveValue('Board A');

		await expect(boardUpdateForm.getByRole('button', { name: 'Update board' })).toBeVisible();
		await expect(boardUpdateForm.getByRole('button', { name: 'Cancel' })).toBeVisible();
	});

	test('should redirect to /projects/:projectId on cancel', async ({ page }) => {
		await page.goto(`/projects/${projectId}/boards/${boardId}/edit`);

		const boardUpdateForm = page.locator('app-board-update-form');
		const cancelButton = boardUpdateForm.getByRole('button', { name: 'Cancel' });

		const nameInput = boardUpdateForm.getByLabel('Name');
		await expect(nameInput).toBeVisible();
		await expect(nameInput).toHaveValue('Board A');

		cancelButton.click();

		await expect(page).toHaveURL(`/projects/${projectId}`);
	});

	test('should update project correctly and redirect to /projects on submit', async ({ page }) => {
		await page.goto(`/projects/${projectId}/boards/${boardId}/edit`);

		const boardUpdateForm = page.locator('app-board-update-form');
		const nameInput = boardUpdateForm.getByLabel('Name');
		await expect(nameInput).toBeVisible();
		await expect(nameInput).toHaveValue('Board A');

		await nameInput.fill('Updated Board A');

		const submitButton = boardUpdateForm.getByRole('button', { name: 'Update Board' });
		submitButton.click();

		await expect(page).toHaveURL(`/projects/${projectId}`);
		await expect(page.locator('app-board-list').getByText('Updated Board A')).toBeVisible();
	});

	test('should have submit button disabled on invalid form state', async ({ page }) => {
		await page.goto(`/projects/${projectId}/boards/${boardId}/edit`);

		const boardUpdateForm = page.locator('app-board-update-form');
		const nameInput = boardUpdateForm.getByLabel('Name');
		await expect(nameInput).toBeVisible();
		await expect(nameInput).toHaveValue('Board A');

		await nameInput.fill(''); // Clear old name

		const submitButton = boardUpdateForm.getByRole('button', { name: 'Update Board' });
		await expect(submitButton).toBeDisabled();
	});
});
