import { APIRequestContext, expect } from '@playwright/test';

const API_URL = `http://localhost:3000/api`;

export async function resetDatabase(request: APIRequestContext) {
	const response = await request.delete(`${API_URL}/test/reset`);
	expect(response.ok()).toBeTruthy();
}

export async function registerUser(request: APIRequestContext, user: { username: string; email: string; password: string; }) {
	const response = await request.post(`${API_URL}/auth/register`, { data: user });
	expect(response.ok()).toBeTruthy();

	const { id } = await response.json();
	return id;
}

export async function loginUser(request: APIRequestContext, credentials: { username: string, password: string }) {
	const response = await request.post(`${API_URL}/auth/login`, { data: credentials });
	expect(response.ok()).toBeTruthy();

	const { token } = await response.json();
	return token;
}

export async function createProject(request: APIRequestContext, authToken: string, data = { name: 'Project A', key: 'PRA', description: '', }) {
	const response = await request.post(`${API_URL}/projects`, {
		headers: { Authorization: `Bearer ${authToken}` },
		data,
	});
	expect(response.ok()).toBeTruthy();

	const { id } = await response.json();
	return id;
}

export async function addProjectMember(request: APIRequestContext, authToken: string, projectId: number, userId: number) {
	const response = await request.post(`${API_URL}/projects/${projectId}/members`, {
		headers: { Authorization: `Bearer ${authToken}` },
		data: { userId },
	});

	expect(response.ok()).toBeTruthy();
}

export async function createBoard(request: APIRequestContext, authToken: string, projectId: number, data = { name: 'Board A' }) {
	const response = await request.post(`${API_URL}/projects/${projectId}/boards`, {
		headers: { Authorization: `Bearer ${authToken}` },
		data,
	});
	expect(response.ok()).toBeTruthy();

	const { id } = await response.json();
	return id;
}

export async function createColumn(request: APIRequestContext, authToken: string, boardId: number, data = { name: 'Column A' }) {
	const response = await request.post(`${API_URL}/boards/${boardId}/columns`, {
		headers: { Authorization: `Bearer ${authToken}` },
		data,
	});
	expect(response.ok()).toBeTruthy();

	const { id } = await response.json();
	return id;
}

export async function createTask(request: APIRequestContext, authToken: string, columnId: number, data = { title: 'Task A', description: 'Description A' }) {
	const response = await request.post(
		`${API_URL}/columns/${columnId}/tasks`, {
		headers: { Authorization: `Bearer ${authToken}` },
		data,
	});

	expect(response.ok()).toBeTruthy();

	const { id } = await response.json();
	return id;
}

export async function assignTask(request: APIRequestContext, authToken: string, taskId: number, userId: number) {
	const response = await request.put(`${API_URL}/tasks/${taskId}/assignee`, {
		headers: { Authorization: `Bearer ${authToken}`, },
		data: { userId },
	});

	expect(response.ok()).toBeTruthy();
}

export async function createComment(request: APIRequestContext, authToken: string, taskId: number, data = { content: 'Comment A' }) {
	const response = await request.post(`${API_URL}/tasks/${taskId}/comments`, {
		headers: { Authorization: `Bearer ${authToken}`, },
		data,
	});

	expect(response.ok()).toBeTruthy();

	const { id } = await response.json();
	return id;
}

