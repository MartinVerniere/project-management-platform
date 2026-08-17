import { test, expect } from '@playwright/test';

test.describe('Column form', () => {
	let authToken: string;
	let adminId: number;
	let projectId: number;
	let boardId: number;

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

		await page.goto('/');
		await page.evaluate((authToken) => { localStorage.setItem('authToken', authToken); }, authToken);
	});

	test('should display column form basic information and actions', async ({ page }) => {
		await page.goto(`/projects/${projectId}/boards/${boardId}/columns/create`);

		const columnForm = page.locator('app-column-form');
		await expect(columnForm.getByLabel('Name')).toBeVisible();

		await expect(columnForm.getByRole('button', { name: 'Create column' })).toBeVisible();
		await expect(columnForm.getByRole('button', { name: 'Cancel' })).toBeVisible();
	});

	test('should redirect to /projects/:projectId/boards/:boardId on cancel', async ({ page }) => {
		await page.goto(`/projects/${projectId}/boards/${boardId}/columns/create`);

		const columnForm = page.locator('app-column-form');
		const cancelButton = columnForm.getByRole('button', { name: 'Cancel' });

		await cancelButton.click();

		await expect(page).toHaveURL(`/projects/${projectId}/boards/${boardId}`);
	});

	test('should create project correctly and redirect to /projects/:projectId/boards/:boardId on submit', async ({ page }) => {
		await page.goto(`/projects/${projectId}/boards/${boardId}/columns/create`);

		const columnForm = page.locator('app-column-form');
		const nameInput = columnForm.getByLabel('Name');

		await nameInput.fill('Column A');

		const submitButton = columnForm.getByRole('button', { name: 'Create column' });
		await submitButton.click();

		await expect(page).toHaveURL(`/projects/${projectId}/boards/${boardId}`);
		const columnList = page.locator('app-column-list');
		await expect(columnList.locator('app-column-element').getByText('Column A')).toBeVisible();
	});

	test('should have submit button disabled on invalid form state', async ({ page }) => {
		await page.goto(`/projects/${projectId}/boards/${boardId}/columns/create`);

		const columnForm = page.locator('app-column-form');
		const nameInput = columnForm.getByLabel('Name');

		// await nameInput.fill('Column A');

		const submitButton = columnForm.getByRole('button', { name: 'Create column' });
		await expect(submitButton).toBeDisabled();
	});
});
