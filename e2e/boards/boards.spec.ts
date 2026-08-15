import { test, expect } from '@playwright/test';

test.describe('Boards', () => {
	let authToken: string;
	let adminId: number;
	let memberId: number;
	let projectId: number;

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
			const createBoardAresponse = await request.post(`http://localhost:3000/api/projects/${projectId}/boards`, {
				headers: { Authorization: `Bearer ${authToken}` },
				data: { name: 'Board A' },
			});
			expect(createBoardAresponse.ok()).toBeTruthy();
			const { id: boardAId } = await createBoardAresponse.json();
			boardId = boardAId;

			const createBoardBresponse = await request.post(`http://localhost:3000/api/projects/${projectId}/boards`, {
				headers: { Authorization: `Bearer ${authToken}` },
				data: { name: 'Board B' },
			});
			expect(createBoardBresponse.ok()).toBeTruthy();
			const { id: boardBId } = await createBoardBresponse.json();
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

			test('should display each member with all actions', async ({ page }) => {
				await page.goto(`/projects/${projectId}`);

				const memberList = page.locator('app-member-list');
				const members = memberList.locator('app-member-element');

				await expect(members).toHaveCount(2);

				for (const member of await members.all()) {
					await expect(member).toBeVisible();
					const removeButton = member.getByRole('button', { name: 'Remove' });
					await expect(removeButton).toBeVisible();
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

			test('should NOT delete member on delete button click if its himself', async ({ page }) => {
				await page.goto(`/projects/${projectId}`);

				const memberList = page.locator('app-member-list');
				const members = memberList.locator('app-member-element');

				const currentMember = memberList
					.locator('app-member-element')
					.filter({ hasText: 'john' });
				const removeButton = currentMember.getByRole('button', { name: 'Remove' });

				await removeButton.click();

				await expect(memberList.locator('app-member-element')).toHaveCount(2);
			});

			test('should delete member on delete button click', async ({ page }) => {
				await page.goto(`/projects/${projectId}`);

				const memberList = page.locator('app-member-list');
				const members = memberList.locator('app-member-element');

				const lastMember = members.last();
				const removeButton = lastMember.getByRole('button', { name: 'Remove' });

				await removeButton.click();

				await expect(memberList.locator('app-member-element')).toHaveCount(1);
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

			test('should display each member with NO actions', async ({ page }) => {
				await page.goto(`/projects/${projectId}`);

				const memberList = page.locator('app-member-list');
				const members = memberList.locator('app-member-element');

				await expect(members).toHaveCount(2);

				for (const member of await members.all()) {
					await expect(member).toBeVisible();
					const removeButton = member.getByRole('button', { name: 'Remove' });
					await expect(removeButton).not.toBeVisible();
				}
			});
		});
	});
});
