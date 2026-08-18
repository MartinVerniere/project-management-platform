import { test, expect } from '@playwright/test';

test.describe('Tasks', () => {
	let authToken: string;
	let adminId: number;
	let memberId: number;
	let projectId: number;
	let boardId: number;
	let columnId: number;

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

		const createColumnAresponse = await request.post(`http://localhost:3000/api/boards/${boardId}/columns`, {
			headers: { Authorization: `Bearer ${authToken}` },
			data: { name: 'Column A' },
		});
		expect(createColumnAresponse.ok()).toBeTruthy();
		const { id: columnAId } = await createColumnAresponse.json();
		columnId = columnAId;

		await page.goto('/');
		await page.evaluate((authToken) => { localStorage.setItem('authToken', authToken); }, authToken);
	});

	test('should display task list basic information and actions', async ({ page }) => {
		await page.goto(`/projects/${projectId}/boards/${boardId}`);

		const column = page.locator('app-column-element');
		const taskList = column.locator('app-task-list');

		await expect(taskList).toBeVisible();
	});

	test.describe('no tasks exist', () => {
		test('should display "No columns yet." when board list is empty', async ({ page }) => {
			await page.goto(`/projects/${projectId}/boards/${boardId}`);

			const column = page.locator('app-column-element');
			const taskList = column.locator('app-task-list');

			await expect(taskList.getByText('No tasks yet!')).toBeVisible();
		});
	});

	test.describe('tasks exist', () => {
		let taskId: number;

		test.beforeEach(async ({ request }) => {
			const createTaskAresponse = await request.post(`http://localhost:3000/api/columns/${columnId}/tasks`, {
				headers: { Authorization: `Bearer ${authToken}` },
				data: { title: 'Task A', description: 'Desc A' },
			});
			expect(createTaskAresponse.ok()).toBeTruthy();
			const { id: taskAId } = await createTaskAresponse.json();
			taskId = taskAId;

			const createTaskBresponse = await request.post(`http://localhost:3000/api/columns/${columnId}/tasks`, {
				headers: { Authorization: `Bearer ${authToken}` },
				data: { title: 'Task B', description: 'Desc B' },
			});
			expect(createTaskBresponse.ok()).toBeTruthy();
			const { id: taskBId } = await createTaskBresponse.json();
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

			test('should display each task with all info and actions', async ({ page }) => {
				await page.goto(`/projects/${projectId}/boards/${boardId}`);

				const column = page.locator('app-column-element');
				const taskList = column.locator('app-task-list');
				const tasks = taskList.locator('app-task-element');

				await expect(tasks).toHaveCount(2);

				for (const task of await tasks.all()) {
					await expect(task).toBeVisible();
					const changeAssigneeButton = task.getByRole('button', { name: 'Change' });
					const addCommentButton = task.getByRole('button', { name: 'Add comment' });
					const editButton = task.getByRole('button', { name: 'Edit' });
					const deleteButton = task.getByRole('button', { name: 'Delete' });
					await expect(changeAssigneeButton).toBeVisible();
					await expect(addCommentButton).toBeVisible();
					await expect(editButton).toBeVisible();
					await expect(deleteButton).toBeVisible();
				}
			});

			test('should redirect to /projects/:projectId/boards/:boardId/columns/:columnId/tasks/:taskId/edit on edit button click', async ({ page }) => {
				await page.goto(`/projects/${projectId}/boards/${boardId}`);

				const column = page.locator('app-column-element');
				const taskList = column.locator('app-task-list');
				const tasks = taskList.locator('app-task-element');

				const firstTask = tasks.first();
				const editButton = firstTask.getByRole('button', { name: 'Edit' });

				await editButton.click();

				await expect(page).toHaveURL(`/projects/${projectId}/boards/${boardId}/columns/${columnId}/tasks/${taskId}/edit`);
			});

			test('should delete board on delete button click', async ({ page }) => {
				await page.goto(`/projects/${projectId}/boards/${boardId}`);

				const column = page.locator('app-column-element');
				const taskList = column.locator('app-task-list');
				const tasks = taskList.locator('app-task-element');

				const firstTask = tasks.first();
				const deleteButton = firstTask.getByRole('button', { name: 'Delete' });

				await deleteButton.click();

				await expect(taskList.locator('app-task-element')).toHaveCount(1);
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

			test('should display each task without CHANGE ASSIGNEE action', async ({ page }) => {
				await page.goto(`/projects/${projectId}/boards/${boardId}`);

				const column = page.locator('app-column-element');
				const taskList = column.locator('app-task-list');
				const tasks = taskList.locator('app-task-element');

				await expect(tasks).toHaveCount(2);

				for (const task of await tasks.all()) {
					await expect(task).toBeVisible();
					const changeAssigneeButton = task.getByRole('button', { name: 'Change' });
					const addCommentButton = task.getByRole('button', { name: 'Add comment' });
					const editButton = task.getByRole('button', { name: 'Edit' });
					const deleteButton = task.getByRole('button', { name: 'Delete' });
					await expect(changeAssigneeButton).not.toBeVisible();
					await expect(addCommentButton).toBeVisible();
					await expect(editButton).toBeVisible();
					await expect(deleteButton).toBeVisible();
				}
			});
		});
	});

	// test.describe('multiple tasks and columns exist', () => {
	// 	let taskAId: number;
	// 	let taskBId: number;
	// 	let secondColumnId: number;

	// 	test.beforeEach(async ({ request }) => {
	// 		const createColumnBresponse = await request.post(`http://localhost:3000/api/boards/${boardId}/columns`, {
	// 			headers: { Authorization: `Bearer ${authToken}` },
	// 			data: { name: 'Column B' },
	// 		});
	// 		expect(createColumnBresponse.ok()).toBeTruthy();
	// 		const { id: columnBId } = await createColumnBresponse.json();
	// 		secondColumnId = columnBId;

	// 		// Add tasks to column A
	// 		const createTaskAresponse = await request.post(`http://localhost:3000/api/columns/${columnId}/tasks`, {
	// 			headers: { Authorization: `Bearer ${authToken}` },
	// 			data: { title: 'Task A', description: 'Desc A' },
	// 		});
	// 		expect(createTaskAresponse.ok()).toBeTruthy();
	// 		const { id: idA } = await createTaskAresponse.json();
	// 		taskAId = idA;

	// 		const createTaskBresponse = await request.post(`http://localhost:3000/api/columns/${columnId}/tasks`, {
	// 			headers: { Authorization: `Bearer ${authToken}` },
	// 			data: { title: 'Task B', description: 'Desc B' },
	// 		});
	// 		expect(createTaskBresponse.ok()).toBeTruthy();
	// 		const { id: idB } = await createTaskBresponse.json();
	// 		taskBId = idB;
	// 	});

	// 	test('should move task to another column on drag-and-drop', async ({ page }) => {
	// 		await page.goto(`/projects/${projectId}/boards/${boardId}`);

	// 		const columnList = page.locator('app-column-list');
	// 		const columnA = columnList.locator('app-column-element').filter({ hasText: 'Column A' });
	// 		const columnB = columnList.locator('app-column-element').filter({ hasText: 'Column B' });

	// 		const taskA = columnA.locator('.cdk-drag').filter({ hasText: 'Task A' });
	// 		await expect(taskA).toBeVisible();
	// 		const taskAHandle = taskA.locator('.cdk-drag-handle');
	// 		await expect(taskAHandle).toBeVisible();

	// 		const taskListB = columnB.locator('app-task-list');
	// 		await expect(taskListB).toBeVisible();
	// 		const dropListB = taskListB.locator('.cdk-drop-list');
	// 		await expect(dropListB).toBeVisible();

	// 		await taskAHandle.dragTo(dropListB);

	// 		await expect(columnA.locator('app-task-element').filter({ hasText: 'Task A' })).not.toBeVisible();
	// 		await expect(columnB.locator('app-task-element').filter({ hasText: 'Task A' })).toBeVisible();
	// 	});

	// 	test('should reorder task when dragged within the same column', async ({ page }) => {
	// 		await page.goto(`/projects/${projectId}/boards/${boardId}`);

	// 		const columnA = page.locator('app-column-list app-column-element').filter({ hasText: 'Column A' });

	// 		const taskList = columnA.locator('app-task-list');
	// 		const dropList = taskList.locator('.cdk-drop-list');

	// 		const taskB = columnA.locator('.cdk-drag').filter({ hasText: 'Task B' });

	// 		await taskB.dragTo(dropList);

	// 		const tasks = columnA.locator('app-task-element');

	// 		await expect(tasks.first()).toHaveText('Task B');
	// 		await expect(tasks.last()).toHaveText('Task A');
	// 	});
	// });
});
