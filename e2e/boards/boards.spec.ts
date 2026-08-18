import { test, expect } from '@playwright/test';
import { resetDatabase, registerUser, loginUser, createProject, createBoard, addProjectMember } from '../helpers';

test.describe('Boards', () => {
	let authToken: string;
	let adminId: number;
	let memberId: number;
	let projectId: number;

	test.beforeEach(async ({ page, request }) => {
		await resetDatabase(request);

		adminId = await registerUser(request, { username: 'john', email: 'john@test.com', password: '12345678' });
		memberId = await registerUser(request, { username: 'alice', email: 'alice@test.com', password: '12345678' });
		authToken = await loginUser(request, { username: 'john', password: '12345678' })
		projectId = await createProject(request, authToken, { name: 'Project A', key: 'PRA', description: '' });
		await addProjectMember(request, authToken, projectId, memberId);

		await page.goto('/');
		await page.evaluate((authToken) => { localStorage.setItem('authToken', authToken); }, authToken);
	});

	test('should display board list basic information and actions', async ({ page }) => {
		await page.goto(`/projects/${projectId}`);

		const projectElement = page.locator('app-project-details');
		const boardList = projectElement.locator('app-board-list');

		await expect(boardList.getByRole('heading', { name: 'Boards' })).toBeVisible();
		await expect(boardList.getByRole('button', { name: 'Add board' })).toBeVisible();
	});

	test('should redirect to board form on "Add board"', async ({ page }) => {
		await page.goto(`/projects/${projectId}`);

		const projectElement = page.locator('app-project-details');
		const boardList = projectElement.locator('app-board-list');

		const createBoardButton = boardList.getByRole('button', { name: 'Add Board' });
		await createBoardButton.click();

		await expect(page).toHaveURL(`/projects/${projectId}/boards/create`);
	});

	test.describe('no boards exist', () => {
		test('should display "No boards yet." when board list is empty', async ({ page }) => {
			await page.goto(`/projects/${projectId}`);

			const projectElement = page.locator('app-project-details');
			const boardList = projectElement.locator('app-board-list');

			await expect(boardList.getByText('No boards yet.')).toBeVisible();
		});
	});

	test.describe('boards exist', () => {
		let boardId: number;

		test.beforeEach(async ({ request }) => {
			boardId = await createBoard(request, authToken, projectId, { name: 'Board A' });
			await createBoard(request, authToken, projectId, { name: 'Board B' });
		});

		test.describe('ADMIN is logged in', () => {
			test.beforeEach(async ({ page, request }) => {
				authToken = await loginUser(request, { username: 'john', password: '12345678' });

				await page.goto('/');
				await page.evaluate((authToken) => { localStorage.setItem('authToken', authToken); }, authToken);
			});

			test('should display each board with all actions', async ({ page }) => {
				await page.goto(`/projects/${projectId}`);

				const boardList = page.locator('app-board-list');
				const boards = boardList.locator('app-board-element');

				await expect(boards).toHaveCount(2);

				for (const board of await boards.all()) {
					await expect(board).toBeVisible();
					const openButton = board.getByRole('button', { name: 'View' });
					const editButton = board.getByRole('button', { name: 'Edit' });
					const deleteButton = board.getByRole('button', { name: 'Delete' });
					await expect(openButton).toBeVisible();
					await expect(editButton).toBeVisible();
					await expect(deleteButton).toBeVisible();
				}
			});

			test('should redirect to /projects/:projectId/boards/:boardId/edit on edit button click', async ({ page }) => {
				await page.goto(`/projects/${projectId}`);

				const boardList = page.locator('app-board-list');
				const boards = boardList.locator('app-board-element');

				const firstBoard = boards.first();
				const editButton = firstBoard.getByRole('button', { name: 'Edit' });

				await editButton.click();

				await expect(page).toHaveURL(`/projects/${projectId}/boards/${boardId}/edit`);
			});

			test('should delete board on delete button click', async ({ page }) => {
				await page.goto(`/projects/${projectId}`);

				const boardList = page.locator('app-board-list');
				const boards = boardList.locator('app-board-element');

				const firstBoard = boards.first();
				const deleteButton = firstBoard.getByRole('button', { name: 'Delete' });

				await deleteButton.click();

				await expect(boardList.locator('app-board-element')).toHaveCount(1);
			});
		});

		test.describe('MEMBER is logged in', () => {
			test.beforeEach(async ({ page, request }) => {
				authToken = await loginUser(request, { username: 'alice', password: '12345678' });

				await page.goto('/');
				await page.evaluate((authToken) => { localStorage.setItem('authToken', authToken); }, authToken);
			});

			test('should display each board without EDIT or DELETE actions', async ({ page }) => {
				await page.goto(`/projects/${projectId}`);

				const boardList = page.locator('app-board-list');
				const boards = boardList.locator('app-board-element');

				await expect(boards).toHaveCount(2);

				for (const board of await boards.all()) {
					await expect(board).toBeVisible();
					const openButton = board.getByRole('button', { name: 'View' });
					const editButton = board.getByRole('button', { name: 'Edit' });
					const deleteButton = board.getByRole('button', { name: 'Delete' });
					await expect(openButton).toBeVisible();
					await expect(editButton).not.toBeVisible();
					await expect(deleteButton).not.toBeVisible();
				}
			});
		});
	});
});
