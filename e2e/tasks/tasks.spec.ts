import { test, expect } from '@playwright/test';
import { resetDatabase, registerUser, loginUser, createProject, addProjectMember, createBoard, createColumn, createTask, assignTask } from '../helpers';

test.describe('Tasks', () => {
	let authToken: string;
	let adminId: number;
	let memberId: number;
	let projectId: number;
	let boardId: number;
	let columnId: number;

	test.beforeEach(async ({ page, request }) => {
		await resetDatabase(request);

		adminId = await registerUser(request, { username: 'john', email: 'john@test.com', password: '12345678' });
		memberId = await registerUser(request, { username: 'alice', email: 'alice@test.com', password: '12345678' });
		authToken = await loginUser(request, { username: 'john', password: '12345678' });
		projectId = await createProject(request, authToken, { name: 'Project A', key: 'PRA', description: '' });
		await addProjectMember(request, authToken, projectId, memberId);
		boardId = await createBoard(request, authToken, projectId, { name: 'Board A' });
		columnId = await createColumn(request, authToken, boardId, { name: 'Column A' });

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
			taskId = await createTask(request, authToken, columnId, { title: 'Task A', description: 'Description A' });
			await createTask(request, authToken, columnId, { title: 'Task B', description: 'Description B' });
		});

		test.describe('ADMIN is logged in', () => {
			test.beforeEach(async ({ page, request }) => {
				authToken = await loginUser(request, { username: 'john', password: '12345678' });

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

			test('should display assignee form on "Change" button click', async ({ page }) => {
				await page.goto(`/projects/${projectId}/boards/${boardId}`);

				const column = page.locator('app-column-element');
				const taskList = column.locator('app-task-list');
				const tasks = taskList.locator('app-task-element');
				const task = tasks.first();

				await task.getByRole('button', { name: 'Change' }).click();

				const assigneeForm = task.locator('.assignee-form');
				const assigneeSelect = assigneeForm.getByRole('combobox');

				await expect(assigneeForm).toBeVisible();
				await expect(assigneeSelect).toBeVisible();
				await expect(task.getByRole('button', { name: 'Set' })).toBeVisible();
				await expect(task.getByRole('button', { name: 'Cancel' })).toBeVisible();
			});

			test('should change task assignee on "Set" button click', async ({ page }) => {
				await page.goto(`/projects/${projectId}/boards/${boardId}`);

				const column = page.locator('app-column-element');
				const taskList = column.locator('app-task-list');
				const tasks = taskList.locator('app-task-element');
				const task = tasks.first();

				await task.getByRole('button', { name: 'Change' }).click();

				const assigneeForm = task.locator('.assignee-form');
				const assigneeSelect = assigneeForm.getByRole('combobox');

				await assigneeSelect.selectOption({ label: 'alice' });

				await task.getByRole('button', { name: 'Set' }).click();

				await expect(task.locator('.assignee-form')).not.toBeVisible();
				await expect(task.locator('.task-assignee-value')).toContainText('alice');
			});

			test('should hide assignee form on "Cancel" button click', async ({ page }) => {
				await page.goto(`/projects/${projectId}/boards/${boardId}`);

				const column = page.locator('app-column-element');
				const taskList = column.locator('app-task-list');
				const tasks = taskList.locator('app-task-element');
				const task = tasks.first();

				await task.getByRole('button', { name: 'Change' }).click();

				const assigneeForm = task.locator('.assignee-form');

				await expect(assigneeForm).toBeVisible();

				await task.getByRole('button', { name: 'Cancel' }).click();

				await expect(assigneeForm).not.toBeVisible();
				await expect(task.getByRole('button', { name: 'Change' })).toBeVisible();
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
				authToken = await loginUser(request, { username: 'alice', password: '12345678' });

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

	test.describe('multiple tasks and columns exist', () => {
		let taskAId: number;
		let taskBId: number;
		let taskCId: number;
		let taskDId: number;
		let secondColumnId: number;
		let thirdColumnId: number;

		test.beforeEach(async ({ request }) => {
			secondColumnId = await createColumn(request, authToken, boardId, { name: 'Column B' });
			thirdColumnId = await createColumn(request, authToken, boardId, { name: 'Column C' });

			// Add tasks to column A
			taskAId = await createTask(request, authToken, columnId, { title: 'Task A', description: 'Description A' });
			taskBId = await createTask(request, authToken, columnId, { title: 'Task B', description: 'Description B' });

			taskCId = await createTask(request, authToken, secondColumnId, { title: 'Task C', description: 'Description C' });
			taskDId = await createTask(request, authToken, thirdColumnId, { title: 'Task D', description: 'Description D' });

			await assignTask(request, authToken, taskAId, memberId);
			await assignTask(request, authToken, taskBId, memberId);
		});

		test('should filter tasks by search term', async ({ page }) => {
			await page.goto(`/projects/${projectId}/boards/${boardId}`);

			const columnList = page.locator('app-column-list');

			const searchInput = columnList.getByLabel('Search');

			await searchInput.fill('Task A');

			await expect(columnList.getByText('Task A')).toBeVisible();
			await expect(columnList.getByText('Task B')).not.toBeVisible();
			await expect(columnList.getByText('Task C')).not.toBeVisible();
			await expect(columnList.getByText('Task D')).not.toBeVisible();
		});

		test('should filter tasks by assignee', async ({ page }) => {
			await page.goto(`/projects/${projectId}/boards/${boardId}`);

			const columnList = page.locator('app-column-list');

			await columnList.getByLabel('Assignee').selectOption({ label: 'alice' });

			await expect(columnList.getByText('Task A')).toBeVisible();
			await expect(columnList.getByText('Task B')).toBeVisible();
			await expect(columnList.getByText('Task C')).not.toBeVisible();
			await expect(columnList.getByText('Task D')).not.toBeVisible();
		});

		test('should clear filters on "Clear" button click', async ({ page }) => {
			await page.goto(`/projects/${projectId}/boards/${boardId}`);

			const columnList = page.locator('app-column-list');
			const searchInput = columnList.getByLabel('Search');

			await searchInput.fill('Task A');

			await expect(columnList.getByText('Task A')).toBeVisible();
			await expect(columnList.getByText('Task B')).not.toBeVisible();
			await expect(columnList.getByText('Task C')).not.toBeVisible();
			await expect(columnList.getByText('Task D')).not.toBeVisible();

			await columnList.getByRole('button', { name: 'Clear' }).click();

			await expect(searchInput).toHaveValue('');

			await expect(columnList.getByText('Task A')).toBeVisible();
			await expect(columnList.getByText('Task B')).toBeVisible();
			await expect(columnList.getByText('Task C')).toBeVisible();
			await expect(columnList.getByText('Task D')).toBeVisible();
		});

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
	});
});
