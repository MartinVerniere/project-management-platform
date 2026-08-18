import { test, expect } from '@playwright/test';
import { resetDatabase, registerUser, loginUser, createProject, addProjectMember } from '../helpers';

test.describe('Members', () => {
	let authToken: string;
	let projectId: number;

	test.beforeEach(async ({ page, request }) => {
		await resetDatabase(request);

		await registerUser(request, { username: 'john', email: 'john@test.com', password: '12345678' });
		const memberId = await registerUser(request, { username: 'alice', email: 'alice@test.com', password: '12345678' });
		await registerUser(request, { username: 'martin', email: 'martin@test.com', password: '12345678' });
		await registerUser(request, { username: 'mary', email: 'mary@test.com', password: '12345678' });
		authToken = await loginUser(request, { username: 'john', password: '12345678' })
		projectId = await createProject(request, authToken, { name: 'Project A', key: 'PRA', description: '' });
		await addProjectMember(request, authToken, projectId, memberId);

		await page.goto('/');
		await page.evaluate((authToken) => { localStorage.setItem('authToken', authToken); }, authToken);
	});

	test.describe('ADMIN is logged in', () => {
		test.beforeEach(async ({ page, request }) => {
			authToken = await loginUser(request, { username: 'john', password: '12345678' });

			await page.goto('/');
			await page.evaluate((authToken) => { localStorage.setItem('authToken', authToken); }, authToken);
		});

		test('should display member list basic information and actions', async ({ page }) => {
			await page.goto(`/projects/${projectId}`);

			const projectElement = page.locator('app-project-details');
			const memberList = projectElement.locator('app-member-list');

			await expect(memberList.getByRole('heading', { name: 'Members' })).toBeVisible();
			await expect(memberList.getByRole('button', { name: 'Add member' })).toBeVisible();
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

		test('should display member form on "Add member" button click', async ({ page }) => {
			await page.goto(`/projects/${projectId}`);

			const memberList = page.locator('app-member-list');
			await memberList.getByRole('button', { name: 'Add member' }).click();

			const memberForm = memberList.locator('app-member-form');

			await expect(memberForm).toBeVisible();
			await expect(memberForm.getByLabel('User')).toBeVisible();
			await expect(memberForm.getByRole('button', { name: 'Cancel' })).toBeVisible();
			await expect(memberForm.getByRole('button', { name: 'Add member' })).toBeVisible();
		});

		test('should only show non-members as selectable users', async ({ page }) => {
			await page.goto(`/projects/${projectId}`);

			const memberList = page.locator('app-member-list');

			await memberList.getByRole('button', { name: 'Add member' }).click();

			const memberForm = memberList.locator('app-member-form');
			const userSelect = memberForm.getByLabel('User');

			await expect(userSelect.locator('option')).toHaveCount(3);

			await expect(userSelect.locator('option', { hasText: 'Select a user' })).toHaveCount(1);
			await expect(userSelect.locator('option', { hasText: 'martin' })).toHaveCount(1);
			await expect(userSelect.locator('option', { hasText: 'mary' })).toHaveCount(1);

			await expect(userSelect.locator('option', { hasText: 'john' })).toHaveCount(0);
			await expect(userSelect.locator('option', { hasText: 'alice' })).toHaveCount(0);
		});

		test('should hide member form on "Cancel" button click', async ({ page }) => {
			await page.goto(`/projects/${projectId}`);

			const memberList = page.locator('app-member-list');
			await memberList.getByRole('button', { name: 'Add member' }).click();

			const memberForm = memberList.locator('app-member-form');

			await expect(memberForm).toBeVisible();

			await memberForm.getByRole('button', { name: 'Cancel' }).click();

			await expect(memberForm).not.toBeVisible();
			await expect(memberList.getByRole('button', { name: 'Add member' })).toBeVisible();
		});

		test('should add member successfully', async ({ page }) => {
			await page.goto(`/projects/${projectId}`);

			const memberList = page.locator('app-member-list');

			await memberList.getByRole('button', { name: 'Add member' }).click();

			const memberForm = memberList.locator('app-member-form');
			const userSelect = memberForm.getByLabel('User');

			await userSelect.selectOption({ label: 'martin' });

			await memberForm.getByRole('button', { name: 'Add member' }).click();

			await expect(memberForm).not.toBeVisible();

			const members = memberList.locator('app-member-element');

			await expect(members).toHaveCount(3);
			await expect(memberList.getByText('martin')).toBeVisible();
		});

		test('should NOT delete member on delete button click if its himself', async ({ page }) => {
			await page.goto(`/projects/${projectId}`);

			const memberList = page.locator('app-member-list');
			const members = memberList.locator('app-member-element');
			const currentMember = members.filter({ hasText: 'john' });
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
			authToken = await loginUser(request, { username: 'alice', password: '12345678' });

			await page.goto('/');
			await page.evaluate((authToken) => { localStorage.setItem('authToken', authToken); }, authToken);
		});

		test('should display member list basic information with NO actions', async ({ page }) => {
			await page.goto(`/projects/${projectId}`);

			const projectElement = page.locator('app-project-details');
			const memberList = projectElement.locator('app-member-list');

			await expect(memberList.getByRole('heading', { name: 'Members' })).toBeVisible();
			await expect(memberList.getByRole('button', { name: 'Add member' })).not.toBeVisible();
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
