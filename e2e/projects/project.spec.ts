import { test, expect } from '@playwright/test';

test.describe('Projects', () => {
	test.beforeEach(async ({ page, request }) => {
		const resetResponse = await request.delete('http://localhost:3000/api/test/reset');

		const registerResponse = await request.post('http://localhost:3000/api/auth/register', {
			data: { username: 'john', email: 'john@test.com', password: '12345678' },
		});
		expect(registerResponse.ok()).toBeTruthy();

		const loginResponse = await request.post('http://localhost:3000/api/auth/login', {
			data: { username: 'john', password: '12345678' },
		});
		expect(loginResponse.ok()).toBeTruthy();

		const { token } = await loginResponse.json();

		await page.goto('/');

		await page.evaluate((token) => { localStorage.setItem('authToken', token); }, token);
	});

	test.describe('no projects exist', () => {
		test('should display project list basic information and actions', async ({ page }) => {
			await page.goto('/projects');

			const projectList = page.locator('app-project-list');
			await expect(projectList.getByRole('heading', { name: 'Projects' })).toBeVisible();
			await expect(projectList.getByRole('button', { name: 'Create project' })).toBeVisible();
		});

		test('should display "No projects yet." when project list is empty', async ({ page }) => {
			await page.goto('/projects');

			const projectList = page.locator('app-project-list');
			await expect(projectList.getByText('No projects yet.')).toBeVisible();
		});

		test('should redirect to project form on "Create project"', async ({ page }) => {
			await page.goto('/projects');

			const projectList = page.locator('app-project-list');
			const createProjectButton = projectList.getByRole('button', { name: 'Create project' });
			await createProjectButton.click();

			await expect(page).toHaveURL('/projects/create');
		});
	});

	test.describe('projects exist', () => {
		test.beforeEach(async ({ page, request }) => {
			const token = await page.evaluate(() => localStorage.getItem('authToken'));

			const createProjectAresponse = await request.post('http://localhost:3000/api/projects', {
				headers: { Authorization: `Bearer ${token}` },
				data: { name: 'Project A', key: 'PRA', description: '' },
			});

			expect(createProjectAresponse.ok()).toBeTruthy();

			const createProjectBresponse = await request.post('http://localhost:3000/api/projects', {
				headers: { Authorization: `Bearer ${token}` },
				data: { name: 'Project B', key: 'PRB', description: '' },
			});

			expect(createProjectBresponse.ok()).toBeTruthy();
		});

		test('should display name and actions for each project in project list', async ({ page, request }) => {
			await page.goto('/projects');

			const projectList = page.locator('app-project-list');
			const projects = projectList.locator('app-project-element');

			await expect(projects).toHaveCount(2);

			for (const project of await projects.all()) {
				await expect(project).toBeVisible();
				const openButton = project.getByRole('button', { name: 'Open' });
				await expect(openButton).toBeVisible();
			}
		});
	});
});
