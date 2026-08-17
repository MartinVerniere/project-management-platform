import { test, expect } from '@playwright/test';

test.describe('Task update form', () => {
	let authToken: string;
	let adminId: number;
	let projectId: number;
	let boardId: number;
	let columnId: number;
	let taskId: number;

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

		const createProjectAresponse = await request.post('http://localhost:3000/api/projects', {
			headers: { Authorization: `Bearer ${authToken}` },
			data: { name: 'Project A', key: 'PRA', description: '' },
		});
		expect(createProjectAresponse.ok()).toBeTruthy();
		const { id: projectAId } = await createProjectAresponse.json();
		projectId = projectAId;

		const createBoardAresponse = await request.post(`http://localhost:3000/api/projects/${projectId}/boards`, {
			headers: { Authorization: `Bearer ${authToken}` },
			data: { name: 'Board A' },
		});
		expect(createBoardAresponse.ok()).toBeTruthy();
		const { id: boardAId } = await createBoardAresponse.json();
		boardId = boardAId;

		const createColumnAresponse = await request.post(`http://localhost:3000/api/boards/${boardId}/columns`, {
			headers: { Authorization: `Bearer ${authToken}` },
			data: { name: 'Column A' },
		});
		expect(createColumnAresponse.ok()).toBeTruthy();
		const { id: columnAId } = await createColumnAresponse.json();
		columnId = columnAId;

		const createTaskAresponse = await request.post(`http://localhost:3000/api/columns/${columnId}/tasks`, {
			headers: { Authorization: `Bearer ${authToken}` },
			data: { title: 'Task A', description: 'Description A' },
		});
		expect(createTaskAresponse.ok()).toBeTruthy();
		const { id: taskAId } = await createTaskAresponse.json();
		taskId = taskAId;

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
