import { test, expect } from '@playwright/test';
import { resetDatabase, registerUser, loginUser, createProject, createBoard, createColumn } from '../helpers';

test.describe('Task form', () => {
	let authToken: string;
	let adminId: number;
	let projectId: number;
	let boardId: number;
	let columnId: number

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

	test('should display task form basic information and actions', async ({ page }) => {
		await page.goto(`/projects/${projectId}/boards/${boardId}/columns/${columnId}/tasks/create`);

		const taskForm = page.locator('app-task-form');
		await expect(taskForm.getByLabel('Title')).toBeVisible();
		await expect(taskForm.getByLabel('Description')).toBeVisible();

		await expect(taskForm.getByRole('button', { name: 'Create task' })).toBeVisible();
		await expect(taskForm.getByRole('button', { name: 'Cancel' })).toBeVisible();
	});

	test('should redirect to /projects/:projectId/boards/:boardId on cancel', async ({ page }) => {
		await page.goto(`/projects/${projectId}/boards/${boardId}/columns/${columnId}/tasks/create`);

		const taskForm = page.locator('app-task-form');
		const cancelButton = taskForm.getByRole('button', { name: 'Cancel' });

		await cancelButton.click();

		await expect(page).toHaveURL(`/projects/${projectId}/boards/${boardId}`);
	});

	test('should create project correctly and redirect to /projects/:projectId/boards/:boardId on submit', async ({ page }) => {
		await page.goto(`/projects/${projectId}/boards/${boardId}/columns/${columnId}/tasks/create`);

		const taskForm = page.locator('app-task-form');
		const titleInput = taskForm.getByLabel('Title');
		const descInput = taskForm.getByLabel('Description');

		await titleInput.fill('Task A');
		await descInput.fill('Description');

		const submitButton = taskForm.getByRole('button', { name: 'Create task' });
		await submitButton.click();

		await expect(page).toHaveURL(`/projects/${projectId}/boards/${boardId}`);
		const columnList = page.locator('app-column-list');
		await expect(columnList.locator('app-task-element').getByText('Task A')).toBeVisible();
	});

	test('should have submit button disabled on invalid form state', async ({ page }) => {
		await page.goto(`/projects/${projectId}/boards/${boardId}/columns/${columnId}/tasks/create`);

		const taskForm = page.locator('app-task-form');
		const titleInput = taskForm.getByLabel('Title');
		const descInput = taskForm.getByLabel('Description');

		// await titleInput.fill('Task A');
		await descInput.fill('Description');

		const submitButton = taskForm.getByRole('button', { name: 'Create task' });
		await expect(submitButton).toBeDisabled();
	});
});
