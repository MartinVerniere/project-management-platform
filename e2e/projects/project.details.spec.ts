import { test, expect } from '@playwright/test';
import { resetDatabase, registerUser, loginUser, createProject } from '../helpers';

test.describe('Projects', () => {
	let authToken: string;
	let adminId: number;
	let projectId: number;

	test.beforeEach(async ({ page, request }) => {
		await resetDatabase(request);

		adminId = await registerUser(request, { username: 'john', email: 'john@test.com', password: '12345678' });
		authToken = await loginUser(request, { username: 'john', password: '12345678' });
		projectId = await createProject(request, authToken, { name: 'Project A', key: 'PRA', description: '' });

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
