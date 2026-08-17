import { test, expect } from '@playwright/test';

test.describe('Projects', () => {
	let authToken: string;
	let adminId: number;
	let projectId: number;

	test.beforeEach(async ({ page, request }) => {
		const resetResponse = await request.delete('http://localhost:3000/api/test/reset');

		const registerResponse = await request.post('http://localhost:3000/api/auth/register', {
			data: { username: 'john', email: 'john@test.com', password: '12345678' },
		});
		expect(registerResponse.ok()).toBeTruthy();
		const { id: registerAId } = await registerResponse.json();
		adminId = registerAId;

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

		await page.goto('/');
		await page.evaluate((authToken) => { localStorage.setItem('authToken', authToken); }, authToken);
	});

	test('should display project basic information and actions', async ({ page }) => {
		await page.goto(`/projects/${projectId}`);

		const projectElement = page.locator('app-project-details');

		await expect(projectElement.getByText('Project A')).toBeVisible();
		await expect(projectElement.getByText('PRA')).toBeVisible();
		await expect(projectElement.getByRole('link', { name: 'Projects' })).toBeVisible();

		const boardList = projectElement.locator('app-board-list');
		await expect(boardList).toBeVisible();

		const memberList = projectElement.locator('app-member-list');
		await expect(memberList).toBeVisible();
	});
});
