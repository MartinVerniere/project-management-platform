import { test, expect } from '@playwright/test';

test.describe('Projects', () => {
	let authToken: string;
	let adminId: number;
	let memberId: number;
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

		const registerBResponse = await request.post('http://localhost:3000/api/auth/register', {
			data: { username: 'alice', email: 'alice@test.com', password: '12345678' },
		});
		expect(registerBResponse.ok()).toBeTruthy();
		const { id: registerBId } = await registerBResponse.json();
		memberId = registerBId;

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

		const updateBoardAresponse = await request.post(`http://localhost:3000/api/projects/${projectId}/boards`, {
			headers: { Authorization: `Bearer ${authToken}` },
			data: { name: 'Board A' },
		});
		expect(updateBoardAresponse.ok()).toBeTruthy();
		const { id: boardAId } = await updateBoardAresponse.json();
		boardId = boardAId;

		await page.goto('/');
		await page.evaluate((authToken) => { localStorage.setItem('authToken', authToken); }, authToken);
	});

	test('should display board basic information and actions', async ({ page }) => {
		await page.goto(`/projects/${projectId}/boards/${boardId}`);

		const boardElement = page.locator('app-board-details');

		await expect(boardElement.getByText('Board A')).toBeVisible();
		await expect(boardElement.getByRole('button', { name: 'Add column' })).toBeVisible();
		await expect(boardElement.getByRole('button', { name: 'Back to project' })).toBeVisible();

		const columnList = boardElement.locator('app-column-list');
		await expect(columnList).toBeVisible();
	});

	test('should redirect to /projects/:projectId/boards/:boardId/columns/create on "Add column" button click', async ({ page }) => {
		await page.goto(`/projects/${projectId}/boards/${boardId}`);

		const boardElement = page.locator('app-board-details');
		const addColumnButton = boardElement.getByRole('button', { name: 'Add column' });

		await addColumnButton.click();
		
		await expect(page).toHaveURL(`/projects/${projectId}/boards/${boardId}/columns/create`);
	});

	test('should return to /projects/:projectId on "Back to project" button click', async ({ page }) => {
		await page.goto(`/projects/${projectId}/boards/${boardId}`);

		const boardElement = page.locator('app-board-details');
		const goBackButton = boardElement.getByRole('button', { name: 'Back to project' });

		await goBackButton.click();
		
		await expect(page).toHaveURL(`/projects/${projectId}`);
	});
});
