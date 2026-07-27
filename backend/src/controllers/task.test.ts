import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';

import { app } from '../app.js';
import { clearDatabase, INVALID_ID, NOT_FOUND_ID } from '../helpers/database.js';

describe('Task API', () => {
	beforeEach(async () => {
		await clearDatabase();
	});

	describe('when at least one user exists in database', () => {
		let johnUserId: number;
		let aliceUserId: number;
		let authToken: string;

		beforeEach(async () => {
			let response = await request(app)
				.post('/api/auth/register')
				.send({
					username: 'john',
					email: 'john@test.com',
					password: 'password123',
				});

			johnUserId = response.body.id;

			response = await request(app)
				.post('/api/auth/register')
				.send({
					username: 'alice',
					email: 'alice@test.com',
					password: 'password123',
				});

			aliceUserId = response.body.id;
		});

		describe('and a user is logged in', () => {
			beforeEach(async () => {
				const response = await request(app)
					.post('/api/auth/login')
					.send({
						username: 'john',
						password: 'password123',
					});

				authToken = response.body.token;
			});

			describe('and at least one project exist in database', () => {
				let projectId: number;

				beforeEach(async () => {
					const response = await request(app)
						.post('/api/projects')
						.set('Authorization', `Bearer ${authToken}`)
						.send({
							name: 'Test 1',
							key: 'TEST1',
							description: 'test desc'
						});

					projectId = response.body.id;
				});

				describe('and project has at least one board', () => {
					let boardId: number;

					beforeEach(async () => {
						const response = await request(app)
							.post(`/api/projects/${projectId}/boards`)
							.set('Authorization', `Bearer ${authToken}`)
							.send({ name: 'Board A' });

						boardId = response.body.id;
					});

					describe('and board has at least one column', () => {
						let columnId: number;

						beforeEach(async () => {
							const response = await request(app)
								.post(`/api/boards/${boardId}/columns`)
								.set('Authorization', `Bearer ${authToken}`)
								.send({ name: 'Column A' });

							columnId = response.body.id;
						});

						describe('and column has at least one task', () => {
							let taskId: number;

							beforeEach(async () => {
								const response = await request(app)
									.post(`/api/columns/${columnId}/tasks`)
									.set('Authorization', `Bearer ${authToken}`)
									.send({ title: 'Task A', description: 'This is task A' });

								taskId = response.body.id;
							});

							describe('and project MEMBER is logged in', () => {
								beforeEach(async () => {
									const response = await request(app)
										.post('/api/auth/login')
										.send({
											username: 'john',
											password: 'password123',
										});

									authToken = response.body.token;
								});

								describe('on get task', () => {
									it('gets task by id', async () => {
										const response = await request(app)
											.get(`/api/tasks/${taskId}`)
											.set('Authorization', `Bearer ${authToken}`);

										expect(response.status).toBe(200);
										expect(response.body.title).toBe('Task A');
									});

									it('returns 400 if invalid task id', async () => {
										const response = await request(app)
											.get(`/api/tasks/${INVALID_ID}`)
											.set('Authorization', `Bearer ${authToken}`);

										expect(response.status).toBe(400);
										expect(response.body.error.message).toBe("Invalid task id.");
									});

									it('returns 404 if task not found', async () => {
										const response = await request(app)
											.get(`/api/tasks/${NOT_FOUND_ID}`)
											.set('Authorization', `Bearer ${authToken}`);

										expect(response.status).toBe(404);
										expect(response.body.error.message).toBe("Task not found.");
									});

									it('returns 401 if token is invalid', async () => {
										const response = await request(app)
											.get(`/api/tasks/${taskId}`)
											.set('Authorization', `Bearer INVALID_TOKEN`);

										expect(response.status).toBe(401);
										expect(response.body.error.message).toBe("Authentication token is invalid.");
									});

									it('returns 401 if token is missing', async () => {
										const response = await request(app)
											.get(`/api/tasks/${taskId}`);

										expect(response.status).toBe(401);
										expect(response.body.error.message).toBe("Authentication token is missing.");
									});
								});

								describe('on update task', () => {
									it('updates task', async () => {
										const response = await request(app)
											.put(`/api/tasks/${taskId}`)
											.set('Authorization', `Bearer ${authToken}`)
											.send({ title: 'Updated task A', description: 'This is task A - UPDATED' });

										expect(response.status).toBe(200);
										expect(response.body.title).toBe('Updated task A');
									});

									it('returns 400 if missing field title in request', async () => {
										const response = await request(app)
											.put(`/api/tasks/${taskId}`)
											.set('Authorization', `Bearer ${authToken}`)
											.send({ description: 'This is task A - UPDATED' });

										expect(response.status).toBe(400);
										expect(response.body.error.message).toBe("Task title is required.");
									});

									it('returns 400 if task title is not a string', async () => {
										const response = await request(app)
											.put(`/api/tasks/${taskId}`)
											.set('Authorization', `Bearer ${authToken}`)
											.send({ title: 5, description: 'This is task A - UPDATED' });

										expect(response.status).toBe(400);
										expect(response.body.error.message).toBe("Task title must be a string.");
									});

									it('returns 400 if task title is an empty string', async () => {
										const response = await request(app)
											.put(`/api/tasks/${taskId}`)
											.set('Authorization', `Bearer ${authToken}`)
											.send({ title: '', description: 'This is task A - UPDATED' });

										expect(response.status).toBe(400);
										expect(response.body.error.message).toBe("Task title is required.");
									});

									it('returns 400 if invalid task id', async () => {
										const response = await request(app)
											.put(`/api/tasks/${INVALID_ID}`)
											.set('Authorization', `Bearer ${authToken}`)
											.send({ title: 'Updated task A', description: 'This is task A - UPDATED' });

										expect(response.status).toBe(400);
										expect(response.body.error.message).toBe("Invalid task id.");
									});

									it('returns 404 if task not found', async () => {
										const response = await request(app)
											.put(`/api/tasks/${NOT_FOUND_ID}`)
											.set('Authorization', `Bearer ${authToken}`)
											.send({ title: 'Updated task A', description: 'This is task A - UPDATED' });

										expect(response.status).toBe(404);
										expect(response.body.error.message).toBe("Task not found.");
									});

									it('returns 401 if token is invalid', async () => {
										const response = await request(app)
											.put(`/api/tasks/${taskId}`)
											.set('Authorization', `Bearer INVALID_TOKEN`)
											.send({ title: 'Updated task A', description: 'This is task A - UPDATED' });

										expect(response.status).toBe(401);
										expect(response.body.error.message).toBe("Authentication token is invalid.");
									});

									it('returns 401 if token is missing', async () => {
										const response = await request(app)
											.put(`/api/tasks/${taskId}`)
											.send({ title: 'Updated task A', description: 'This is task A - UPDATED' });

										expect(response.status).toBe(401);
										expect(response.body.error.message).toBe("Authentication token is missing.");
									});
								});

								describe('on add comment to task', () => {
									it('adds comment', async () => {
										const response = await request(app)
											.post(`/api/tasks/${taskId}/comments`)
											.set('Authorization', `Bearer ${authToken}`)
											.send({ content: 'This is a comment!' });

										expect(response.status).toBe(201);
										expect(response.body.content).toBe('This is a comment!');
									});

									it('returns 400 if missing field content in request', async () => {
										const response = await request(app)
											.post(`/api/tasks/${taskId}/comments`)
											.set('Authorization', `Bearer ${authToken}`)
											.send({});

										expect(response.status).toBe(400);
										expect(response.body.error.message).toBe("Comment is required.");
									});

									it('returns 400 if comment content is not a string', async () => {
										const response = await request(app)
											.post(`/api/tasks/${taskId}/comments`)
											.set('Authorization', `Bearer ${authToken}`)
											.send({ content: 5 });

										expect(response.status).toBe(400);
										expect(response.body.error.message).toBe("Comment must be a string.");
									});

									it('returns 400 if comment content is an empty string', async () => {
										const response = await request(app)
											.post(`/api/tasks/${taskId}/comments`)
											.set('Authorization', `Bearer ${authToken}`)
											.send({ content: '' });

										expect(response.status).toBe(400);
										expect(response.body.error.message).toBe("Comment is required.");
									});

									it('returns 400 if invalid task id', async () => {
										const response = await request(app)
											.post(`/api/tasks/${INVALID_ID}/comments`)
											.set('Authorization', `Bearer ${authToken}`)
											.send({ content: 'This is a comment!' });

										expect(response.status).toBe(400);
										expect(response.body.error.message).toBe("Invalid task id.");
									});

									it('returns 404 if task not found', async () => {
										const response = await request(app)
											.post(`/api/tasks/${NOT_FOUND_ID}/comments`)
											.set('Authorization', `Bearer ${authToken}`)
											.send({ content: 'This is a comment!' });

										expect(response.status).toBe(404);
										expect(response.body.error.message).toBe("Task not found.");
									});

									it('returns 401 if token is invalid', async () => {
										const response = await request(app)
											.post(`/api/tasks/${taskId}/comments`)
											.set('Authorization', `Bearer INVALID_TOKEN`)
											.send({ content: 'This is a comment!' });

										expect(response.status).toBe(401);
										expect(response.body.error.message).toBe("Authentication token is invalid.");
									});

									it('returns 401 if token is missing', async () => {
										const response = await request(app)
											.post(`/api/tasks/${taskId}/comments`)
											.send({ content: 'This is a comment!' });

										expect(response.status).toBe(401);
										expect(response.body.error.message).toBe("Authentication token is missing.");
									});
								});

								describe('on delete task', () => {
									it('deletes task', async () => {
										const response = await request(app)
											.delete(`/api/tasks/${taskId}`)
											.set('Authorization', `Bearer ${authToken}`);

										expect(response.status).toBe(204);
									});
									it('returns 400 if invalid task id', async () => {
										const response = await request(app)
											.delete(`/api/tasks/${INVALID_ID}`)
											.set('Authorization', `Bearer ${authToken}`);

										expect(response.status).toBe(400);
										expect(response.body.error.message).toBe("Invalid task id.");
									});
									it('returns 404 if task not found', async () => {
										const response = await request(app)
											.delete(`/api/tasks/${NOT_FOUND_ID}`)
											.set('Authorization', `Bearer ${authToken}`);

										expect(response.status).toBe(404);
										expect(response.body.error.message).toBe("Task not found.");
									});
									it('returns 401 if token is invalid', async () => {
										const response = await request(app)
											.delete(`/api/tasks/${taskId}`)
											.set('Authorization', `Bearer INVALID_TOKEN`);

										expect(response.status).toBe(401);
										expect(response.body.error.message).toBe("Authentication token is invalid.");
									});
									it('returns 401 if token is missing', async () => {
										const response = await request(app)
											.delete(`/api/tasks/${taskId}`);

										expect(response.status).toBe(401);
										expect(response.body.error.message).toBe("Authentication token is missing.");
									});
								});
							});

							describe('and non-MEMBER is logged in', () => {
								beforeEach(async () => {
									const response = await request(app)
										.post('/api/auth/login')
										.send({
											username: 'alice',
											password: 'password123',
										});

									authToken = response.body.token;
								});

								describe('on get task', () => {
									it('returns 403 if user is not a member of the project that contains the task', async () => {
										const response = await request(app)
											.get(`/api/tasks/${taskId}`)
											.set('Authorization', `Bearer ${authToken}`);

										expect(response.status).toBe(403);
										expect(response.body.error.message).toBe("You do not have access to this project.");
									});
								});

								describe('on update task', () => {
									it('returns 403 if user is not a member of the project that contains the task', async () => {
										const response = await request(app)
											.put(`/api/tasks/${taskId}`)
											.set('Authorization', `Bearer ${authToken}`)
											.send({ title: 'Updated task A', description: 'This is task A - UPDATED' });

										expect(response.status).toBe(403);
										expect(response.body.error.message).toBe("You do not have access to this project.");
									});
								});

								describe('on add comment to task', () => {
									it('returns 403 if user is not a member of the project that contains the task', async () => {
										const response = await request(app)
											.post(`/api/tasks/${taskId}/comments`)
											.set('Authorization', `Bearer ${authToken}`)
											.send({ content: 'This is an updated comment!' });

										expect(response.status).toBe(403);
										expect(response.body.error.message).toBe("You do not have access to this project.");
									});
								});

								describe('on delete task', () => {
									it('returns 403 if user is not a member of the project that contains the task', async () => {
										const response = await request(app)
											.delete(`/api/tasks/${taskId}`)
											.set('Authorization', `Bearer ${authToken}`);

										expect(response.status).toBe(403);
										expect(response.body.error.message).toBe("You do not have access to this project.");
									});
								});
							});
						});

						describe('and column has at least two tasks', () => {
							let taskAId: number;
							let taskBId: number;

							beforeEach(async () => {
								let response = await request(app)
									.post(`/api/columns/${columnId}/tasks`)
									.set('Authorization', `Bearer ${authToken}`)
									.send({ title: 'Task A', description: 'This is task A' });

								taskAId = response.body.id;

								response = await request(app)
									.post(`/api/columns/${columnId}/tasks`)
									.set('Authorization', `Bearer ${authToken}`)
									.send({ title: 'Task B', description: 'This is task B' });

								taskBId = response.body.id;
							});

							describe('and project MEMBER is logged in', () => {
								beforeEach(async () => {
									const response = await request(app)
										.post('/api/auth/login')
										.send({
											username: 'john',
											password: 'password123',
										});

									authToken = response.body.token;
								});

								describe('on update task', () => {
									it('returns 409 if a task with that same title already exists in that column', async () => {
										const response = await request(app)
											.put(`/api/tasks/${taskAId}`)
											.set('Authorization', `Bearer ${authToken}`)
											.send({ title: 'Task B', description: 'This is task B' });

										expect(response.status).toBe(409);
										expect(response.body.error.message).toBe("A task with this title already exists in the column.");
									});
								});
							});
						});
					});
				});
			});
		});
	});
}); 