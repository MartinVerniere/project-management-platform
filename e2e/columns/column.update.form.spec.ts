import { test, expect } from '@playwright/test';
import { resetDatabase, registerUser, loginUser, createProject, createBoard, createColumn } from '../helpers';

test.describe('Column update form', () => {
	let authToken: string;
	let adminId: number;
	let projectId: number;
	let boardId: number;
	let columnId: number;

	test.beforeEach(async ({ page, request }) => {
		await resetDatabase(request);

		adminId = await registerUser(request, { username: 'john', email: 'john@test.com', password: '12345678' });
		authToken = await loginUser(request, { username: 'john', password: '12345678' });
		projectId = await createProject(request, authToken, { name: 'Project A', key: 'PRA', description: '' });
		boardId = await createBoard(request, authToken, projectId, { name: 'Board A' });
		columnId = await createColumn(request, authToken, boardId, { name: 'Column A' });

		await page.goto('/');
		await page.evaluate((authToken) => { localStorage.setItem('authToken', authToken); }, authToken);
	});

	test('should display column form basic information (with previous values) and actions', async ({ page }) => {
		await page.goto(`/projects/${projectId}/boards/${boardId}/columns/${columnId}/edit`);

		const columnUpdateForm = page.locator('app-column-update-form');
		await expect(columnUpdateForm.getByLabel('Name')).toBeVisible();

		await expect(columnUpdateForm.getByRole('button', { name: 'Save changes' })).toBeVisible();
		await expect(columnUpdateForm.getByRole('button', { name: 'Cancel' })).toBeVisible();
	});

	test('should redirect to /projects/:projectId/boards/:boardId on cancel', async ({ page }) => {
		await page.goto(`/projects/${projectId}/boards/${boardId}/columns/${columnId}/edit`);

		const columnUpdateForm = page.locator('app-column-update-form');
		const cancelButton = columnUpdateForm.getByRole('button', { name: 'Cancel' });

		const nameInput = columnUpdateForm.getByLabel('Name');
		await expect(nameInput).toBeVisible();
		await expect(nameInput).toHaveValue('Column A');

		await cancelButton.click();

		await expect(page).toHaveURL(`/projects/${projectId}/boards/${boardId}`);
	});

	test('should create project correctly and redirect to /projects/:projectId/boards/:boardId on submit', async ({ page }) => {
		await page.goto(`/projects/${projectId}/boards/${boardId}/columns/${columnId}/edit`);

		const columnUpdateForm = page.locator('app-column-update-form');
		const nameInput = columnUpdateForm.getByLabel('Name');
		await expect(nameInput).toBeVisible();
		await expect(nameInput).toHaveValue('Column A');

		await nameInput.fill('Updated Column A');

		const submitButton = columnUpdateForm.getByRole('button', { name: 'Save changes' });
		await submitButton.click();

		await expect(page).toHaveURL(`/projects/${projectId}/boards/${boardId}`);
		const columnList = page.locator('app-column-list');
		await expect(columnList.locator('app-column-element').getByText('Updated Column A')).toBeVisible();
	});

	test('should have submit button disabled on invalid form state', async ({ page }) => {
		await page.goto(`/projects/${projectId}/boards/${boardId}/columns/${columnId}/edit`);

		const columnUpdateForm = page.locator('app-column-update-form');
		const nameInput = columnUpdateForm.getByLabel('Name');
		await expect(nameInput).toBeVisible();
		await expect(nameInput).toHaveValue('Column A');

		await nameInput.fill('');

		const submitButton = columnUpdateForm.getByRole('button', { name: 'Save changes' });
		await expect(submitButton).toBeDisabled();
	});
});
