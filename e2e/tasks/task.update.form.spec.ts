import { test, expect } from '@playwright/test';
import { resetDatabase, registerUser, loginUser, createProject, createBoard, createColumn, createTask } from '../helpers';

test.describe('Task update form', () => {
	let authToken: string;
	let adminId: number;
	let projectId: number;
	let boardId: number;
	let columnId: number;
	let taskId: number;

	test.beforeEach(async ({ page, request }) => {
		await resetDatabase(request);

		adminId = await registerUser(request, { username: 'john', email: 'john@test.com', password: '12345678' });
		authToken = await loginUser(request, { username: 'john', password: '12345678' });
		projectId = await createProject(request, authToken, { name: 'Project A', key: 'PRA', description: '' });
		boardId = await createBoard(request, authToken, projectId, { name: 'Board A' });
		columnId = await createColumn(request, authToken, boardId, { name: 'Column A' });
		taskId = await createTask(request, authToken, columnId, { title: 'Task A', description: 'Description A' });

		await page.goto('/');
		await page.evaluate((authToken) => { localStorage.setItem('authToken', authToken); }, authToken);
	});

	test('should display task form basic information (with previous values) and actions', async ({ page }) => {
		await page.goto(`/projects/${projectId}/boards/${boardId}/columns/${columnId}/tasks/${taskId}/edit`);

		const taskUpdateForm = page.locator('app-task-update-form');
		await expect(taskUpdateForm.getByLabel('Title')).toBeVisible();
		await expect(taskUpdateForm.getByLabel('Description')).toBeVisible();

		await expect(taskUpdateForm.getByRole('button', { name: 'Update task' })).toBeVisible();
		await expect(taskUpdateForm.getByRole('button', { name: 'Cancel' })).toBeVisible();
	});

	test('should redirect to /projects/:projectId/boards/:boardId on cancel', async ({ page }) => {
		await page.goto(`/projects/${projectId}/boards/${boardId}/columns/${columnId}/tasks/${taskId}/edit`);

		const taskUpdateForm = page.locator('app-task-update-form');
		const cancelButton = taskUpdateForm.getByRole('button', { name: 'Cancel' });

		const titleInput = taskUpdateForm.getByLabel('Title');
		const descInput = taskUpdateForm.getByLabel('Description');

		await expect(titleInput).toBeVisible();
		await expect(titleInput).toHaveValue('Task A');

		await expect(descInput).toBeVisible();
		await expect(descInput).toHaveValue('Description A');

		await cancelButton.click();

		await expect(page).toHaveURL(`/projects/${projectId}/boards/${boardId}`);
	});

	test('should create project correctly and redirect to /projects/:projectId/boards/:boardId on submit', async ({ page }) => {
		await page.goto(`/projects/${projectId}/boards/${boardId}/columns/${columnId}/tasks/${taskId}/edit`);

		const taskUpdateForm = page.locator('app-task-update-form');
		const titleInput = taskUpdateForm.getByLabel('Title');
		const descInput = taskUpdateForm.getByLabel('Description');

		await expect(titleInput).toBeVisible();
		await expect(titleInput).toHaveValue('Task A');

		await expect(descInput).toBeVisible();
		await expect(descInput).toHaveValue('Description A');

		await titleInput.fill('Updated Task A');

		const submitButton = taskUpdateForm.getByRole('button', { name: 'Update task' });
		await submitButton.click();

		await expect(page).toHaveURL(`/projects/${projectId}/boards/${boardId}`);
		const columnList = page.locator('app-column-list');
		await expect(columnList.locator('app-column-element').getByText('Updated Task A')).toBeVisible();
	});

	test('should have submit button disabled on invalid form state', async ({ page }) => {
		await page.goto(`/projects/${projectId}/boards/${boardId}/columns/${columnId}/tasks/${taskId}/edit`);

		const taskUpdateForm = page.locator('app-task-update-form');
		const titleInput = taskUpdateForm.getByLabel('Title');
		const descInput = taskUpdateForm.getByLabel('Description');

		await expect(titleInput).toBeVisible();
		await expect(titleInput).toHaveValue('Task A');

		await expect(descInput).toBeVisible();
		await expect(descInput).toHaveValue('Description A');

		await titleInput.fill('');

		const submitButton = taskUpdateForm.getByRole('button', { name: 'Update task' });
		await expect(submitButton).toBeDisabled();
	});
});
