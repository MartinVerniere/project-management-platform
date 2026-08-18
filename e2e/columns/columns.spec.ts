import { test, expect } from '@playwright/test';
import { resetDatabase, registerUser, loginUser, createProject, createBoard, addProjectMember, createColumn } from '../helpers';

test.describe('Columns', () => {
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
		await addProjectMember(request, authToken, projectId, memberId);
		boardId = await createBoard(request, authToken, projectId, { name: 'Board A' });

		await page.goto('/');
		await page.evaluate((authToken) => { localStorage.setItem('authToken', authToken); }, authToken);
	});

	test('should display column list basic information and actions', async ({ page }) => {
		await page.goto(`/projects/${projectId}/boards/${boardId}`);

		const board = page.locator('app-board-details');
		const columnList = board.locator('app-column-list');

		await expect(columnList.getByLabel('Search')).toBeVisible();
		await expect(columnList.getByLabel('Assignee')).toBeVisible();
		await expect(columnList.getByRole('button', { name: 'Clear' })).toBeVisible();
	});

	test.describe('no columns exist', () => {
		test('should display "No columns yet." when board list is empty', async ({ page }) => {
			await page.goto(`/projects/${projectId}/boards/${boardId}`);

			const board = page.locator('app-board-details');
			const columnList = board.locator('app-column-list');

			await expect(columnList.getByText('No columns yet!')).toBeVisible();
		});
	});

	test.describe('columns exist', () => {
		let columnId: number;

		test.beforeEach(async ({ request }) => {
			columnId = await createColumn(request, authToken, boardId, { name: 'Column A' });
			await createColumn(request, authToken, boardId, { name: 'Column B' });
		});

		test.describe('ADMIN is logged in', () => {
			test.beforeEach(async ({ page, request }) => {
				authToken = await loginUser(request, { username: 'john', password: '12345678' });

				await page.goto('/');
				await page.evaluate((authToken) => { localStorage.setItem('authToken', authToken); }, authToken);
			});

			test('should display each column with all info and actions', async ({ page }) => {
				await page.goto(`/projects/${projectId}/boards/${boardId}`);

				const board = page.locator('app-board-details');
				const columnList = board.locator('app-column-list');
				const columns = columnList.locator('app-column-element');

				await expect(columns).toHaveCount(2);

				for (const column of await columns.all()) {
					await expect(column).toBeVisible();
					const addTaskButton = column.getByRole('button', { name: 'Add task' });
					const editButton = column.getByRole('button', { name: 'Edit' });
					const deleteButton = column.getByRole('button', { name: 'Delete' });
					await expect(addTaskButton).toBeVisible();
					await expect(editButton).toBeVisible();
					await expect(deleteButton).toBeVisible();
				}
			});

			test('should redirect to /projects/:projectId/boards/:boardId/columns/:columnId/edit on edit button click', async ({ page }) => {
				await page.goto(`/projects/${projectId}/boards/${boardId}`);

				const board = page.locator('app-board-details');
				const columnList = board.locator('app-column-list');
				const columns = columnList.locator('app-column-element');

				const firstColumn = columns.first();
				const editButton = firstColumn.getByRole('button', { name: 'Edit' });

				await editButton.click();

				await expect(page).toHaveURL(`/projects/${projectId}/boards/${boardId}/columns/${columnId}/edit`);
			});

			test('should delete board on delete button click', async ({ page }) => {
				await page.goto(`/projects/${projectId}/boards/${boardId}`);

				const board = page.locator('app-board-details');
				const columnList = board.locator('app-column-list');
				const columns = columnList.locator('app-column-element');

				const firstColumn = columns.first();
				const deleteButton = firstColumn.getByRole('button', { name: 'Delete' });

				await deleteButton.click();

				await expect(columnList.locator('app-column-element')).toHaveCount(1);
			});
		});

		test.describe('MEMBER is logged in', () => {
			test.beforeEach(async ({ page, request }) => {
				authToken = await loginUser(request, { username: 'alice', password: '12345678' });

				await page.goto('/');
				await page.evaluate((authToken) => { localStorage.setItem('authToken', authToken); }, authToken);
			});

			test('should display each column without EDIT or DELETE actions', async ({ page }) => {
				await page.goto(`/projects/${projectId}/boards/${boardId}`);

				const board = page.locator('app-board-details');
				const columnList = board.locator('app-column-list');
				const columns = columnList.locator('app-column-element');

				await expect(columns).toHaveCount(2);

				for (const column of await columns.all()) {
					await expect(column).toBeVisible();
					const addTaskButton = column.getByRole('button', { name: 'Add task' });
					const editButton = column.getByRole('button', { name: 'Edit' });
					const deleteButton = column.getByRole('button', { name: 'Delete' });
					await expect(addTaskButton).toBeVisible();
					await expect(editButton).not.toBeVisible();
					await expect(deleteButton).not.toBeVisible();
				}
			});
		});
	});

	// test.describe('multiple columns exist', () => {
	// 	let columnAId: number;
	// 	let columnBId: number;

	// 	test.beforeEach(async ({ request }) => {
	// 		columnAId = await createColumn(request, authToken, boardId, { name: 'Column A' });
	// 		columnBId = await createColumn(request, authToken, boardId, { name: 'Column B' });;
	// 	});

	// 	test('should reorder columns when dragging one to a different position', async ({ page }) => {
	// 		await page.goto(`/projects/${projectId}/boards/${boardId}`);

	// 		const columnList = page.locator('app-column-list');
	// 		const columnA = columnList.locator('app-column-element').filter({ hasText: 'Column A' });
	// 		const columnB = columnList.locator('app-column-element').filter({ hasText: 'Column B' });

	// 		const columnAHandle = columnA.locator('.cdk-drag-handle');
	// 		await expect(columnAHandle).toBeVisible();

	// 		const dropList = columnList.locator('.cdk-drop-list').first();

	// 		await columnAHandle.dragTo(dropList);

	// 		const columns = columnList.locator('app-column-element');

	// 		await expect(columns.first()).toHaveText('Column B');
	// 		await expect(columns.last()).toHaveText('Column A');
	// 	});
	// });
});
