import request from 'supertest';
import { app } from "../app.js";
import type { UserDto } from '../../../shared/models/user.js';
import type { LoginDto } from '../../../shared/models/auth.js';
import type { ProjectDto, ProjectMemberDto } from '../../../shared/models/project.js';
import type { BoardDto } from '../../../shared/models/board.js';
import type { ColumnDto } from '../../../shared/models/column.js';
import type { TaskDto } from '../../../shared/models/task.js';
import type { CommentDto } from '../../../shared/models/comment.js';

export const registerUser = async (username: string, email: string, password: string): Promise<UserDto> => {
	const response = await request(app)
		.post('/api/auth/register')
		.send({
			username: username,
			email: email,
			password: password,
		});

	return response.body;
}

export const loginUser = async (username: string, password: string): Promise<LoginDto> => {
	const response = await request(app)
		.post('/api/auth/login')
		.send({ username: username, password: password, });

	return response.body;
}

export const createProject = async (authToken: string, name: string, key: string, description: string = "Test project"): Promise<ProjectDto> => {
	const response = await request(app)
		.post('/api/projects')
		.set('Authorization', `Bearer ${authToken}`)
		.send({ name, key, description });

	return response.body;
}

export const addMember = async (authToken: string, projectId: number, userId: number): Promise<ProjectMemberDto> => {
	const response = await request(app)
		.post(`/api/projects/${projectId}/members`)
		.set('Authorization', `Bearer ${authToken}`)
		.send({ userId });
	return response.body;
}

export const createBoard = async (authToken: string, projectId: number, name: string): Promise<BoardDto> => {
	const response = await request(app)
		.post(`/api/projects/${projectId}/boards`)
		.set('Authorization', `Bearer ${authToken}`)
		.send({ name });

	return response.body;
}

export const createColumn = async (authToken: string, boardId: number, name: string): Promise<ColumnDto> => {
	const response = await request(app)
		.post(`/api/boards/${boardId}/columns`)
		.set('Authorization', `Bearer ${authToken}`)
		.send({ name });

	return response.body;
}

export const createTask = async (authToken: string, columnId: number, title: string, description: string = "Test task"): Promise<TaskDto> => {
	const response = await request(app)
		.post(`/api/columns/${columnId}/tasks`)
		.set('Authorization', `Bearer ${authToken}`)
		.send({ title, description });

	return response.body;
}

export const createComment = async (authToken: string, taskId: number, content: string): Promise<CommentDto> => {
	const response = await request(app)
		.post(`/api/tasks/${taskId}/comments`)
		.set('Authorization', `Bearer ${authToken}`)
		.send({ content });

	return response.body;
}