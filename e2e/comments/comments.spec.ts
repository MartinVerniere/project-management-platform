import { test, expect } from '@playwright/test';
import { resetDatabase, registerUser, loginUser, createProject, createBoard, createColumn, addProjectMember, createTask, createComment } from '../helpers';

test.describe('Comments', () => {
	let authToken: string;
	let adminId: number;
	let authorId: number;
	let nonAuthorId: number;
	let projectId: number;
	let boardId: number;
	let columnId: number;
	let taskId: number;

	test.beforeEach(async ({ page, request }) => {
		await resetDatabase(request);

		adminId = await registerUser(request, { username: 'john', email: 'john@test.com', password: '12345678' });
		authorId = await registerUser(request, { username: 'alice', email: 'alice@test.com', password: '12345678' });
		nonAuthorId = await registerUser(request, { username: 'martin', email: 'martin@test.com', password: '12345678' });
		authToken = await loginUser(request, { username: 'john', password: '12345678' });
		projectId = await createProject(request, authToken, { name: 'Project A', key: 'PRA', description: '' });
		await addProjectMember(request, authToken, projectId, authorId);
		await addProjectMember(request, authToken, projectId, nonAuthorId);
		boardId = await createBoard(request, authToken, projectId, { name: 'Board A' });
		columnId = await createColumn(request, authToken, boardId, { name: 'Column A' });
		taskId = await createTask(request, authToken, columnId, { title: 'Task A', description: 'Description A' });

		await page.goto('/');
		await page.evaluate((authToken) => { localStorage.setItem('authToken', authToken); }, authToken);
	});

	test('should display comment list basic information and actions', async ({ page }) => {
		await page.goto(`/projects/${projectId}/boards/${boardId}`);

		const task = page.locator('app-task-element');
		const commentList = task.locator('app-comment-list');

		await expect(commentList).toBeVisible();
	});

	test('should display comment form on "Add comment" button click', async ({ page }) => {
		await page.goto(`/projects/${projectId}/boards/${boardId}`);

		const task = page.locator('app-task-element');
		const commentList = task.locator('app-comment-list');
		const addButton = commentList.getByRole('button', { name: 'Add comment' });

		await addButton.click();

		const commentForm = commentList.locator('app-comment-form');

		await expect(commentForm).toBeVisible();
		await expect(commentForm.getByLabel('Comment')).toBeVisible();
		await expect(commentForm.getByRole('button', { name: 'Add comment' })).toBeVisible();
		await expect(commentForm.getByRole('button', { name: 'Cancel' })).toBeVisible();
	});

	test('should create comment successfully and hide form', async ({ page }) => {
		await page.goto(`/projects/${projectId}/boards/${boardId}`);

		const task = page.locator('app-task-element');
		const commentList = task.locator('app-comment-list');
		const addButton = commentList.getByRole('button', { name: 'Add comment' });

		await addButton.click();

		const commentForm = commentList.locator('app-comment-form');
		const contentInput = commentForm.getByLabel('Comment');

		await contentInput.fill('Comment A');

		const submitButton = commentList.getByRole('button', { name: 'Add comment' });

		await submitButton.click();

		await expect(commentForm).not.toBeVisible();
		await expect(commentList.getByText('Comment A')).toBeVisible();
	});

	test('should close comment form on Cancel button click', async ({ page }) => {
		await page.goto(`/projects/${projectId}/boards/${boardId}`);

		const task = page.locator('app-task-element');
		const commentList = task.locator('app-comment-list');
		const addButton = commentList.getByRole('button', { name: 'Add comment' });

		await addButton.click();

		const commentForm = commentList.locator('app-comment-form');

		await expect(commentForm).toBeVisible();

		const cancelButton = commentList.getByRole('button', { name: 'Cancel' });

		await cancelButton.click();

		await expect(commentForm).not.toBeVisible();
		await expect(commentList.getByRole('button', { name: 'Add comment' })).toBeVisible();
	});

	test.describe('no comments exist', () => {
		test('should display "No comments yet." when comment list is empty', async ({ page }) => {
			await page.goto(`/projects/${projectId}/boards/${boardId}`);

			const task = page.locator('app-task-element');
			const commentList = task.locator('app-comment-list');

			await expect(commentList.getByText('No comments yet!')).toBeVisible();
		});
	});

	test.describe('comments exist', () => {
		let commentId: number;

		test.beforeEach(async ({ request }) => {
			authToken = await loginUser(request, { username: 'alice', password: '12345678' });

			commentId = await createComment(request, authToken, taskId, { content: 'Comment A' });
			await createComment(request, authToken, taskId, { content: 'Comment B' });
		});

		test.describe('ADMIN is logged in', () => {
			test.beforeEach(async ({ page, request }) => {
				authToken = await loginUser(request, { username: 'john', password: '12345678' });

				await page.goto('/');
				await page.evaluate((authToken) => { localStorage.setItem('authToken', authToken); }, authToken);
			});

			test('should display each task with all info and actions', async ({ page }) => {
				await page.goto(`/projects/${projectId}/boards/${boardId}`);

				const task = page.locator('app-task-element');
				const commentList = task.locator('app-comment-list');
				const comments = commentList.locator('app-comment-element');

				await expect(comments).toHaveCount(2);

				for (const comment of await comments.all()) {
					await expect(comment).toBeVisible();
					await expect(comment.getByText('alice')).toBeVisible();
					const editButton = comment.getByRole('button', { name: 'Edit' });
					const deleteButton = comment.getByRole('button', { name: 'Delete' });
					await expect(editButton).toBeVisible();
					await expect(deleteButton).toBeVisible();
				}
			});

			test('should display comment update form on edit button click', async ({ page }) => {
				await page.goto(`/projects/${projectId}/boards/${boardId}`);

				const task = page.locator('app-task-element');
				const commentList = task.locator('app-comment-list');
				const comments = commentList.locator('app-comment-element');

				const firstComment = comments.first();
				const editButton = firstComment.getByRole('button', { name: 'Edit' });

				await editButton.click();

				await expect(firstComment.getByText('Comment A')).toBeVisible();
				await expect(firstComment.getByRole('button', { name: 'Edit comment' })).toBeVisible();
				await expect(firstComment.getByRole('button', { name: 'Cancel' })).toBeVisible();
			});

			test('should update comment successfully on Edit comment button click', async ({ page }) => {
				await page.goto(`/projects/${projectId}/boards/${boardId}`);

				const task = page.locator('app-task-element');
				const commentList = task.locator('app-comment-list');
				const comments = commentList.locator('app-comment-element');

				const firstComment = comments.first();
				const editButton = firstComment.getByRole('button', { name: 'Edit' });

				await editButton.click();

				const commentUpdateForm = firstComment.locator('app-comment-update-form');
				const contentInput = commentUpdateForm.getByLabel('Comment');
				const updateButton = commentUpdateForm.getByRole('button', { name: 'Edit comment' });

				await expect(commentUpdateForm).toBeVisible();
				await expect(contentInput).toHaveValue('Comment A');

				await contentInput.fill('Updated Comment A');
				await updateButton.click();

				await expect(commentUpdateForm).not.toBeVisible();
				await expect(firstComment.getByText('Updated Comment A')).toBeVisible();
			});

			test('should close update comment form on Cancel button click', async ({ page }) => {
				await page.goto(`/projects/${projectId}/boards/${boardId}`);

				const task = page.locator('app-task-element');
				const commentList = task.locator('app-comment-list');
				const comments = commentList.locator('app-comment-element');

				const firstComment = comments.first();
				const editButton = firstComment.getByRole('button', { name: 'Edit' });

				await editButton.click();

				const commentUpdateForm = firstComment.locator('app-comment-update-form');
				const contentInput = commentUpdateForm.getByLabel('Comment');
				const cancelButton = commentUpdateForm.getByRole('button', { name: 'Cancel' });

				await expect(commentUpdateForm).toBeVisible();
				await expect(contentInput).toHaveValue('Comment A');

				await cancelButton.click();

				await expect(commentUpdateForm).not.toBeVisible();
			});

			test('should delete comment on delete button click', async ({ page }) => {
				await page.goto(`/projects/${projectId}/boards/${boardId}`);

				const task = page.locator('app-task-element');
				const commentList = task.locator('app-comment-list');
				const comments = commentList.locator('app-comment-element');

				const firstComment = comments.first();
				const deleteButton = firstComment.getByRole('button', { name: 'Delete' });

				await deleteButton.click();

				await expect(commentList.locator('app-comment-element')).toHaveCount(1);
			});
		});

		test.describe('AUTHOR is logged in', () => {
			test.beforeEach(async ({ page, request }) => {
				authToken = await loginUser(request, { username: 'alice', password: '12345678' });

				await page.goto('/');
				await page.evaluate((authToken) => { localStorage.setItem('authToken', authToken); }, authToken);
			});

			test('should display each task with all info and action', async ({ page }) => {
				await page.goto(`/projects/${projectId}/boards/${boardId}`);

				const task = page.locator('app-task-element');
				const commentList = task.locator('app-comment-list');
				const comments = commentList.locator('app-comment-element');

				await expect(comments).toHaveCount(2);

				for (const comment of await comments.all()) {
					await expect(comment).toBeVisible();
					await expect(comment.getByText('alice')).toBeVisible();
					const editButton = comment.getByRole('button', { name: 'Edit' });
					const deleteButton = comment.getByRole('button', { name: 'Delete' });
					await expect(editButton).toBeVisible();
					await expect(deleteButton).toBeVisible();
				}
			});
		});

		test.describe('non AUTHOR is logged in', () => {
			test.beforeEach(async ({ page, request }) => {
				authToken = await loginUser(request, { username: 'martin', password: '12345678' });

				await page.goto('/');
				await page.evaluate((authToken) => { localStorage.setItem('authToken', authToken); }, authToken);
			});

			test('should display each task without EDIT or DELETE action', async ({ page }) => {
				await page.goto(`/projects/${projectId}/boards/${boardId}`);

				const task = page.locator('app-task-element');
				const commentList = task.locator('app-comment-list');
				const comments = commentList.locator('app-comment-element');

				await expect(comments).toHaveCount(2);

				for (const comment of await comments.all()) {
					await expect(comment).toBeVisible();
					await expect(comment.getByText('alice')).toBeVisible();
					const editButton = comment.getByRole('button', { name: 'Edit' });
					const deleteButton = comment.getByRole('button', { name: 'Delete' });
					await expect(editButton).not.toBeVisible();
					await expect(deleteButton).not.toBeVisible();
				}
			});
		});
	});
});
