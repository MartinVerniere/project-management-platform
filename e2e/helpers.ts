import { APIRequestContext, expect } from '@playwright/test';

export async function resetDatabase(request: APIRequestContext) {
	const response = await request.delete('http://localhost:3000/api/test/reset');
	expect(response.ok()).toBeTruthy();
}

export async function registerUser(request: APIRequestContext, user: { username: string; email: string; password: string; }) {
	const response = await request.post('http://localhost:3000/api/auth/register', { data: user });
	expect(response.ok()).toBeTruthy();

	const { id } = await response.json();
	return id;
}

export async function loginUser(request: APIRequestContext, credentials: { username: string, password: string }) {
	const response = await request.post('http://localhost:3000/api/auth/login', { data: credentials });
	expect(response.ok()).toBeTruthy();

	const { token } = await response.json();
	return token;
}

export async function createProject(request: APIRequestContext, authToken: string, data = { name: 'Project A', key: 'PRA', description: '', }) {
	const response = await request.post('http://localhost:3000/api/projects', {
		headers: { Authorization: `Bearer ${authToken}` },
		data,
	});
	expect(response.ok()).toBeTruthy();

	const { id } = await response.json();
	return id;
}

export async function addProjectMember(request: APIRequestContext, authToken: string, projectId: number, userId: number) {
	const response = await request.post(`http://localhost:3000/api/projects/${projectId}/members`, {
		headers: { Authorization: `Bearer ${authToken}`, },
		data: { userId },
	});

	expect(response.ok()).toBeTruthy();
}

export async function createBoard(request: APIRequestContext, authToken: string, projectId: number, data = { name: 'Board A' }) {
	const response = await request.post(`http://localhost:3000/api/projects/${projectId}/boards`, {
		headers: { Authorization: `Bearer ${authToken}` },
		data,
	});
	expect(response.ok()).toBeTruthy();

	const { id } = await response.json();
	return id;
}

export async function createColumn(request: APIRequestContext, authToken: string, boardId: number, data = { name: 'Column A' }) {
	const response = await request.post(`http://localhost:3000/api/boards/${boardId}/columns`, {
		headers: { Authorization: `Bearer ${authToken}` },
		data,
	});
	expect(response.ok()).toBeTruthy();

	const { id } = await response.json();
	return id;
}

export async function createTask(request: APIRequestContext, authToken: string, columnId: number, data = { title: 'Task A', description: 'Description A' }) {
	const response = await request.post(
		`http://localhost:3000/api/columns/${columnId}/tasks`, {
		headers: { Authorization: `Bearer ${authToken}` },
		data,
	});

	expect(response.ok()).toBeTruthy();

	const { id } = await response.json();
	return id;
}

export async function createComment(request: APIRequestContext, authToken: string, taskId: number, data = { content: 'Comment A' }) {
	const response = await request.post(`http://localhost:3000/api/tasks/${taskId}/comments`, {
		headers: { Authorization: `Bearer ${authToken}`, },
		data,
	});

	expect(response.ok()).toBeTruthy();

	const { id } = await response.json();
	return id;
}

