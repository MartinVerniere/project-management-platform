import { test, expect } from '@playwright/test';
import { resetDatabase, registerUser, loginUser, createProject, addProjectMember } from '../helpers';

test.describe('Projects', () => {
	let authToken: string;
	let adminId: number;
	let memberId: number;
	let nonMemberId: number;

	test.beforeEach(async ({ page, request }) => {
		await resetDatabase(request);

		adminId = await registerUser(request, { username: 'john', email: 'john@test.com', password: '12345678' });
		memberId = await registerUser(request, { username: 'alice', email: 'alice@test.com', password: '12345678' });
		nonMemberId = await registerUser(request, { username: 'martin', email: 'martin@test.com', password: '12345678' });
		authToken = await loginUser(request, { username: 'john', password: '12345678' });

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
			const projectAId = await createProject(request, authToken, { name: 'Project A', key: 'PRA', description: '' });
			const projectBId = await createProject(request, authToken, { name: 'Project B', key: 'PRB', description: '' });
			await addProjectMember(request, authToken, projectAId, memberId);
			await addProjectMember(request, authToken, projectBId, memberId);
		});

		test.describe('ADMIN is logged in', () => {
			test.beforeEach(async ({ page, request }) => {
				authToken = await loginUser(request, { username: 'john', password: '12345678' });

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
				authToken = await loginUser(request, { username: 'alice', password: '12345678' });

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
				authToken = await loginUser(request, { username: 'martin', password: '12345678' });

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
