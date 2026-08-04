import request from 'supertest';
import { app } from "../app.js";
import type { LoginResponse, UserResponse } from '../models/user.js';
import type { ProjectMemberResponse, ProjectResponse } from '../models/project.js';
import type { BoardResponse } from '../models/board.js';
import type { ColumnResponse } from '../models/column.js';

export interface TaskResponse {
	id: number;
	title: string;
	description: string | null;
	columnId: number;
	order: number;
}

export interface CommentResponse {
	id: number;
	content: string;
	taskId: number;
	userId: number;
}

export const registerUser = async (username: string, email: string, password: string): Promise<UserResponse> => {
	const response = await request(app)
		.post('/api/auth/register')
		.send({
			username: username,
			email: email,
			password: password,
		});

	return response.body;
}

export const loginUser = async (username: string, password: string): Promise<LoginResponse> => {
	const response = await request(app)
		.post('/api/auth/login')
		.send({
			username: username,
			password: password,
		});

	return response.body;
}

export const createProject = async (authToken: string, name: string, key: string, description: string = "Test project"): Promise<ProjectResponse> => {
	const response = await request(app)
		.post('/api/projects')
		.set('Authorization', `Bearer ${authToken}`)
		.send({ name, key, description });

	return response.body;
}

export const addMember = async (authToken: string, projectId: number, userId: number): Promise<ProjectMemberResponse> => {
	const response = await request(app)
		.post(`/api/projects/${projectId}/members`)
		.set('Authorization', `Bearer ${authToken}`)
		.send({ userId });
	return response.body;
}

export const createBoard = async (authToken: string, projectId: number, name: string): Promise<BoardResponse> => {
	const response = await request(app)
		.post(`/api/projects/${projectId}/boards`)
		.set('Authorization', `Bearer ${authToken}`)
		.send({ name });

	return response.body;
}

export const createColumn = async (authToken: string, boardId: number, name: string): Promise<ColumnResponse> => {
	const response = await request(app)
		.post(`/api/boards/${boardId}/columns`)
		.set('Authorization', `Bearer ${authToken}`)
		.send({ name });

	return response.body;
}

export const createTask = async (authToken: string, columnId: number, title: string, description: string = "Test task"): Promise<TaskResponse> => {
	const response = await request(app)
		.post(`/api/columns/${columnId}/tasks`)
		.set('Authorization', `Bearer ${authToken}`)
		.send({ title, description });

	return response.body;
}

export const createComment = async (authToken: string, taskId: number, content: string): Promise<CommentResponse> => {
	const response = await request(app)
		.post(`/api/tasks/${taskId}/comments`)
		.set('Authorization', `Bearer ${authToken}`)
		.send({ content });

	return response.body;
}