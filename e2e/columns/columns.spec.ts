import { test, expect } from '@playwright/test';

test.describe('Columns', () => {
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

		const addMemberResponse = await request.post(`http://localhost:3000/api/projects/${projectId}/members`, {
			headers: { Authorization: `Bearer ${authToken}` },
			data: { userId: memberId }
		});
		expect(addMemberResponse.ok()).toBeTruthy();

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
			const createColumnAresponse = await request.post(`http://localhost:3000/api/boards/${boardId}/columns`, {
				headers: { Authorization: `Bearer ${authToken}` },
				data: { name: 'Column A' },
			});
			expect(createColumnAresponse.ok()).toBeTruthy();
			const { id: columnAId } = await createColumnAresponse.json();
			columnId = columnAId;

			const createColumnBresponse = await request.post(`http://localhost:3000/api/boards/${boardId}/columns`, {
				headers: { Authorization: `Bearer ${authToken}` },
				data: { name: 'Column B' },
			});
			expect(createColumnBresponse.ok()).toBeTruthy();
			const { id: columnBId } = await createColumnBresponse.json();
		});

		test.describe('ADMIN is logged in', () => {
			test.beforeEach(async ({ page, request }) => {
				const loginResponse = await request.post('http://localhost:3000/api/auth/login', {
					data: { username: 'john', password: '12345678' },
				});
				expect(loginResponse.ok()).toBeTruthy();
				const loginResponseJSON = await loginResponse.json();
				authToken = loginResponseJSON.token;

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
				const loginResponse = await request.post('http://localhost:3000/api/auth/login', {
					data: { username: 'alice', password: '12345678' },
				});
				expect(loginResponse.ok()).toBeTruthy();
				const loginResponseJSON = await loginResponse.json();
				authToken = loginResponseJSON.token;

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
	// 		const createColumnAresponse = await request.post(`http://localhost:3000/api/boards/${boardId}/columns`, {
	// 			headers: { Authorization: `Bearer ${authToken}` },
	// 			data: { name: 'Column A' },
	// 		});
	// 		expect(createColumnAresponse.ok()).toBeTruthy();
	// 		const { id: idA } = await createColumnAresponse.json();
	// 		columnAId = idA;

	// 		const createColumnBresponse = await request.post(`http://localhost:3000/api/boards/${boardId}/columns`, {
	// 			headers: { Authorization: `Bearer ${authToken}` },
	// 			data: { name: 'Column B' },
	// 		});
	// 		expect(createColumnBresponse.ok()).toBeTruthy();
	// 		const { id: idB } = await createColumnBresponse.json();
	// 		columnBId = idB;
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
