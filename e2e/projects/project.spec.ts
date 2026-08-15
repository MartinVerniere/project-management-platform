import { test, expect } from '@playwright/test';

test.describe('Projects', () => {
	let authToken: string;
	let adminId: number;
	let memberId: number;
	let nonMemberId: number;

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

		const registerCResponse = await request.post('http://localhost:3000/api/auth/register', {
			data: { username: 'martin', email: 'martin@test.com', password: '12345678' },
		});
		expect(registerBResponse.ok()).toBeTruthy();
		const { id: registerCId } = await registerCResponse.json();
		nonMemberId = registerCId;

		const loginResponse = await request.post('http://localhost:3000/api/auth/login', {
			data: { username: 'john', password: '12345678' },
		});
		expect(loginResponse.ok()).toBeTruthy();
		const loginResponseJSON = await loginResponse.json();
		authToken = loginResponseJSON.token;

		await page.goto('/');

		await page.evaluate((authToken) => { localStorage.setItem('authToken', authToken); }, authToken);
	});

	test('should display project list basic information and actions', async ({ page }) => {
		await page.goto('/projects');

		const projectList = page.locator('app-project-list');
		await expect(projectList.getByRole('heading', { name: 'Projects' })).toBeVisible();
		await expect(projectList.getByRole('button', { name: 'Create project' })).toBeVisible();
	});

	test('should redirect to project form on "Create project"', async ({ page }) => {
		await page.goto('/projects');

		const projectList = page.locator('app-project-list');
		const createProjectButton = projectList.getByRole('button', { name: 'Create project' });
		await createProjectButton.click();

		await expect(page).toHaveURL('/projects/create');
	});

	test.describe('no projects exist', () => {
		test('should display "No projects yet." when project list is empty', async ({ page }) => {
			await page.goto('/projects');

			const projectList = page.locator('app-project-list');
			await expect(projectList.getByText('No projects yet.')).toBeVisible();
		});
	});

	test.describe('projects exist', () => {
		test.beforeEach(async ({ request }) => {
			const createProjectAresponse = await request.post('http://localhost:3000/api/projects', {
				headers: { Authorization: `Bearer ${authToken}` },
				data: { name: 'Project A', key: 'PRA', description: '' },
			});
			expect(createProjectAresponse.ok()).toBeTruthy();
			const { id: projectAId } = await createProjectAresponse.json();

			const createProjectBresponse = await request.post('http://localhost:3000/api/projects', {
				headers: { Authorization: `Bearer ${authToken}` },
				data: { name: 'Project B', key: 'PRB', description: '' },
			});
			expect(createProjectBresponse.ok()).toBeTruthy();
			const { id: projectBId } = await createProjectBresponse.json();

			const addMemberResponse = await request.post(`http://localhost:3000/api/projects/${projectAId}/members`, {
				headers: { Authorization: `Bearer ${authToken}` },
				data: { userId: memberId }
			});
			expect(addMemberResponse.ok()).toBeTruthy();

			const addMemberResponseB = await request.post(`http://localhost:3000/api/projects/${projectBId}/members`, {
				headers: { Authorization: `Bearer ${authToken}` },
				data: { userId: memberId }
			});
			expect(addMemberResponseB.ok()).toBeTruthy();
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

			test('should display each project with all actions', async ({ page }) => {
				await page.goto('/projects');

				const projectList = page.locator('app-project-list');
				const projects = projectList.locator('app-project-element');

				await expect(projects).toHaveCount(2);

				for (const project of await projects.all()) {
					await expect(project).toBeVisible();
					const openButton = project.getByRole('button', { name: 'Open' });
					const deleteButton = project.getByRole('button', { name: 'Delete' });
					await expect(openButton).toBeVisible();
					await expect(deleteButton).toBeVisible();
				}
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

			test('should display each project without DELETE action', async ({ page }) => {
				await page.goto('/projects');

				const projectList = page.locator('app-project-list');
				const projects = projectList.locator('app-project-element');

				await expect(projects).toHaveCount(2);

				for (const project of await projects.all()) {
					await expect(project).toBeVisible();
					const openButton = project.getByRole('button', { name: 'Open' });
					const deleteButton = project.getByRole('button', { name: 'Delete' });
					await expect(openButton).toBeVisible();
					await expect(deleteButton).not.toBeVisible();
				}
			});
		});

		test.describe('non-MEMBER is logged in', () => {
			test.beforeEach(async ({ page, request }) => {
				const loginResponse = await request.post('http://localhost:3000/api/auth/login', {
					data: { username: 'martin', password: '12345678' },
				});
				expect(loginResponse.ok()).toBeTruthy();
				const loginResponseJSON = await loginResponse.json();
				authToken = loginResponseJSON.token;

				await page.goto('/');

				await page.evaluate((authToken) => { localStorage.setItem('authToken', authToken); }, authToken);
			});

			test('should display only his projects', async ({ page }) => {
				await page.goto('/projects');

				const projectList = page.locator('app-project-list');
				await expect(projectList.getByText('No projects yet.')).toBeVisible();
			});
		});
	});
});
