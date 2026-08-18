import { test, expect } from '@playwright/test';
import { createBoard, createProject, loginUser, registerUser, resetDatabase } from '../helpers';

test.describe('Projects', () => {
	let authToken: string;
	let adminId: number;
	let memberId: number;
	let projectId: number;
	let boardId: number;

	test.beforeEach(async ({ page, request }) => {
		await resetDatabase(request);

		adminId = await registerUser(request, { username: 'john', email: 'john@test.com', password: '12345678' });
		memberId = await registerUser(request, { username: 'alice', email: 'alice@test.com', password: '12345678' });
		authToken = await loginUser(request, { username: 'john', password: '12345678' });
		projectId = await createProject(request, authToken, { name: 'Project A', key: 'PRA', description: '' });
		boardId = await createBoard(request, authToken, projectId, { name: 'Board A' });

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
