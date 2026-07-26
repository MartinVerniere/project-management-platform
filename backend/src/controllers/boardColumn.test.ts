import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';

import { app } from '../app.js';
import { clearDatabase, INVALID_ID, NOT_FOUND_ID } from '../helpers/database.js';

describe('Board API', () => {
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

						describe('on get column', () => {
							it('gets column by id', async () => {
								const response = await request(app)
									.get(`/api/columns/${columnId}`)
									.set('Authorization', `Bearer ${authToken}`);

								expect(response.status).toBe(200);
								expect(response.body.name).toBe('Column A');
							});

							it('returns 400 if invalid column id', async () => {
								const response = await request(app)
									.get(`/api/columns/${INVALID_ID}`)
									.set('Authorization', `Bearer ${authToken}`);

								expect(response.status).toBe(400);
								expect(response.body.error.message).toBe("Invalid column id.");
							});

							it('returns 404 if column not found', async () => {
								const response = await request(app)
									.get(`/api/columns/${NOT_FOUND_ID}`)
									.set('Authorization', `Bearer ${authToken}`);

								expect(response.status).toBe(404);
								expect(response.body.error.message).toBe("Column not found.");
							});

							it('returns 401 if token is invalid', async () => {
								const response = await request(app)
									.get(`/api/columns/${columnId}`)
									.set('Authorization', `Bearer INVALID_TOKEN`);

								expect(response.status).toBe(401);
								expect(response.body.error.message).toBe("Authentication token is invalid.");
							});

							it('returns 401 if token is missing', async () => {
								const response = await request(app)
									.get(`/api/columns/${columnId}`);

								expect(response.status).toBe(401);
								expect(response.body.error.message).toBe("Authentication token is missing.");
							});
						});

						describe('on update column', () => {
							it('updates column', async () => {
								const response = await request(app)
									.put(`/api/columns/${columnId}`)
									.set('Authorization', `Bearer ${authToken}`)
									.send({ name: "Updated Column A" });

								expect(response.status).toBe(200);
								expect(response.body.name).toBe('Updated Column A');
							});

							it('returns 400 if missing field name in request', async () => {
								const response = await request(app)
									.put(`/api/columns/${columnId}`)
									.set('Authorization', `Bearer ${authToken}`)
									.send({});

								expect(response.status).toBe(400);
								expect(response.body.error.message).toBe("Column name is required.");
							});

							it('returns 400 if column name is not a string', async () => {
								const response = await request(app)
									.put(`/api/columns/${columnId}`)
									.set('Authorization', `Bearer ${authToken}`)
									.send({ name: 5 });

								expect(response.status).toBe(400);
								expect(response.body.error.message).toBe("Column name must be a string.");
							});

							it('returns 400 if column name is an empty string', async () => {
								const response = await request(app)
									.put(`/api/columns/${columnId}`)
									.set('Authorization', `Bearer ${authToken}`)
									.send({ name: "" });

								expect(response.status).toBe(400);
								expect(response.body.error.message).toBe("Column name is required.");
							});

							it('returns 409 if column name already exists in that board', async () => {
								const response = await request(app)
									.put(`/api/columns/${columnId}`)
									.set('Authorization', `Bearer ${authToken}`)
									.send({ name: 'Column A' });

								expect(response.status).toBe(409);
								expect(response.body.error.message).toBe('A column with this name already exists in the board.');
							});

							it('returns 400 if invalid column id', async () => {
								const response = await request(app)
									.put(`/api/columns/${INVALID_ID}`)
									.set('Authorization', `Bearer ${authToken}`)
									.send({ name: "Updated Column A" });

								expect(response.status).toBe(400);
								expect(response.body.error.message).toBe("Invalid column id.");
							});

							it('returns 404 if column not found', async () => {
								const response = await request(app)
									.put(`/api/columns/${NOT_FOUND_ID}`)
									.set('Authorization', `Bearer ${authToken}`)
									.send({ name: "Updated Board A" });

								expect(response.status).toBe(404);
								expect(response.body.error.message).toBe("Column not found.");
							});

							it('returns 401 if token is invalid', async () => {
								const response = await request(app)
									.put(`/api/columns/${columnId}`)
									.set('Authorization', `Bearer INVALID_TOKEN`)
									.send({ name: "Updated Board A" });

								expect(response.status).toBe(401);
								expect(response.body.error.message).toBe("Authentication token is invalid.");
							});

							it('returns 401 if token is missing', async () => {
								const response = await request(app)
									.put(`/api/columns/${columnId}`)

								expect(response.status).toBe(401);
								expect(response.body.error.message).toBe("Authentication token is missing.");
							});
						});

						describe('on delete column', () => {
							it('deletes column', async () => {
								const response = await request(app)
									.delete(`/api/columns/${columnId}`)
									.set('Authorization', `Bearer ${authToken}`);

								expect(response.status).toBe(204);
							});

							it('returns 400 if invalid column id', async () => {
								const response = await request(app)
									.delete(`/api/columns/${INVALID_ID}`)
									.set('Authorization', `Bearer ${authToken}`);

								expect(response.status).toBe(400);
								expect(response.body.error.message).toBe("Invalid column id.");
							});

							it('returns 404 if column not found', async () => {
								const response = await request(app)
									.delete(`/api/columns/${NOT_FOUND_ID}`)
									.set('Authorization', `Bearer ${authToken}`);

								expect(response.status).toBe(404);
								expect(response.body.error.message).toBe("Column not found.");
							});

							it('returns 401 if token is invalid', async () => {
								const response = await request(app)
									.delete(`/api/columns/${columnId}`)
									.set('Authorization', `Bearer INVALID_TOKEN`);

								expect(response.status).toBe(401);
								expect(response.body.error.message).toBe("Authentication token is invalid.");
							});

							it('returns 401 if token is missing', async () => {
								const response = await request(app)
									.delete(`/api/columns/${columnId}`);

								expect(response.status).toBe(401);
								expect(response.body.error.message).toBe("Authentication token is missing.");
							});
						});

						describe('on add task to column', () => {
							it('adds task', async () => {
								const response = await request(app)
									.post(`/api/columns/${columnId}/tasks`)
									.set('Authorization', `Bearer ${authToken}`)
									.send({ title: 'Task A' });

								expect(response.status).toBe(201);
								expect(response.body.title).toBe('Task A');
							});

							it('returns 400 if missing field title in request', async () => {
								const response = await request(app)
									.post(`/api/columns/${columnId}/tasks`)
									.set('Authorization', `Bearer ${authToken}`)
									.send({ description: 'Desc' });

								expect(response.status).toBe(400);
								expect(response.body.error.message).toBe("Task title is required.");
							});

							it('returns 400 if task title is not a string', async () => {
								const response = await request(app)
									.post(`/api/columns/${columnId}/tasks`)
									.set('Authorization', `Bearer ${authToken}`)
									.send({ title: 5 });

								expect(response.status).toBe(400);
								expect(response.body.error.message).toBe("Task title must be a string.");
							});

							it('returns 400 if task title is an empty string', async () => {
								const response = await request(app)
									.post(`/api/columns/${columnId}/tasks`)
									.set('Authorization', `Bearer ${authToken}`)
									.send({ title: '' });

								expect(response.status).toBe(400);
								expect(response.body.error.message).toBe("Task title is required.");
							});

							it('returns 400 if invalid column id', async () => {
								const response = await request(app)
									.post(`/api/columns/${INVALID_ID}/tasks`)
									.set('Authorization', `Bearer ${authToken}`)
									.send({ title: 'Task A' });

								expect(response.status).toBe(400);
								expect(response.body.error.message).toBe("Invalid column id.");
							});

							it('returns 404 if column not found', async () => {
								const response = await request(app)
									.post(`/api/columns/${NOT_FOUND_ID}/tasks`)
									.set('Authorization', `Bearer ${authToken}`)
									.send({ title: '' });

								expect(response.status).toBe(404);
								expect(response.body.error.message).toBe("Column not found.");
							});

							it('returns 401 if token is invalid', async () => {
								const response = await request(app)
									.post(`/api/columns/${columnId}/tasks`)
									.set('Authorization', `Bearer INVALID_TOKEN`)
									.send({ title: "Updated Task A" });

								expect(response.status).toBe(401);
								expect(response.body.error.message).toBe("Authentication token is invalid.");
							});

							it('returns 401 if token is missing', async () => {
								const response = await request(app)
									.post(`/api/columns/${columnId}/tasks`)
									.send({ title: "Updated Task A" });

								expect(response.status).toBe(401);
								expect(response.body.error.message).toBe("Authentication token is missing.");
							});
						});

						describe('and column has at least one task', () => {
							beforeEach(async () => {
								await request(app)
									.post(`/api/columns/${columnId}/tasks`)
									.set('Authorization', `Bearer ${authToken}`)
									.send({ title: 'Title A' });
							});

							it('returns 409 if a task with that same title already exists in that column', async () => {
								const response = await request(app)
									.post(`/api/columns/${columnId}/tasks`)
									.set('Authorization', `Bearer ${authToken}`)
									.send({ title: 'Title A' });

								expect(response.status).toBe(409);
								expect(response.body.error.message).toBe("A task with this title already exists in the column.");
							});
						});

						describe('and column has multiple tasks', () => {
							let taskAId: number;
							let taskBId: number;

							beforeEach(async () => {
								let response = await request(app)
									.post(`/api/columns/${columnId}/tasks`)
									.set('Authorization', `Bearer ${authToken}`)
									.send({ title: 'Task A' });

								taskAId = response.body.id;

								response = await request(app)
									.post(`/api/columns/${columnId}/tasks`)
									.set('Authorization', `Bearer ${authToken}`)
									.send({ title: 'Task B' });

								taskBId = response.body.id;
							});

							describe('on edit task order', () => {
								it('orders tasks', async () => {
									const order = [
										{ id: taskAId, order: 1 },
										{ id: taskBId, order: 0 }
									];

									const response = await request(app)
										.put(`/api/columns/${columnId}/tasks/order`)
										.set('Authorization', `Bearer ${authToken}`)
										.send({ taskOrder: order });

									expect(response.status).toBe(200);
									expect(response.body.tasks[0].title).toBe("Task B");
									expect(response.body.tasks[1].title).toBe("Task A");
								});

								it('returns 400 if task order is missing', async () => {
									const response = await request(app)
										.put(`/api/columns/${columnId}/tasks/order`)
										.set('Authorization', `Bearer ${authToken}`)
										.send({});

									expect(response.status).toBe(400);
									expect(response.body.error.message).toBe("Task order is required.");
								});

								it('returns 400 if invalid task order (is not an array)', async () => {
									const badOrder = { id: taskAId, order: 2 };

									const response = await request(app)
										.put(`/api/columns/${columnId}/tasks/order`)
										.set('Authorization', `Bearer ${authToken}`)
										.send({ taskOrder: badOrder });

									expect(response.status).toBe(400);
									expect(response.body.error.message).toBe("Task order must be an array.");
								});

								it('returns 400 if missing tasks in order', async () => {
									const badOrder = [
										{ id: taskAId, order: 2 }
									];

									const response = await request(app)
										.put(`/api/columns/${columnId}/tasks/order`)
										.set('Authorization', `Bearer ${authToken}`)
										.send({ taskOrder: badOrder });

									expect(response.status).toBe(400);
									expect(response.body.error.message).toBe("Every task must be included.");
								});

								it('returns 400 if one of the tasks in the order has invalid id', async () => {
									const badOrder = [
										{ id: INVALID_ID, order: 2 },
										{ id: taskBId, order: 1 }
									];

									const response = await request(app)
										.put(`/api/columns/${columnId}/tasks/order`)
										.set('Authorization', `Bearer ${authToken}`)
										.send({ taskOrder: badOrder });

									expect(response.status).toBe(400);
									expect(response.body.error.message).toBe("Invalid task id.");
								});

								it('returns 400 if one of the tasks in the order has invalid order', async () => {
									const badOrder = [
										{ id: taskAId, order: 'abc' },
										{ id: taskBId, order: 1 }
									];

									const response = await request(app)
										.put(`/api/columns/${columnId}/tasks/order`)
										.set('Authorization', `Bearer ${authToken}`)
										.send({ taskOrder: badOrder });

									expect(response.status).toBe(400);
									expect(response.body.error.message).toBe("Invalid task order.");
								});

								it('returns 400 if one of the tasks in the order does not belong to the column', async () => {
									const badOrder = [
										{ id: taskAId, order: 1 },
										{ id: NOT_FOUND_ID, order: 0 }
									];

									const response = await request(app)
										.put(`/api/columns/${columnId}/tasks/order`)
										.set('Authorization', `Bearer ${authToken}`)
										.send({ taskOrder: badOrder });

									expect(response.status).toBe(400);
									expect(response.body.error.message).toBe("Task does not belong to this column.");
								});

								it('returns 400 if invalid column id', async () => {
									const order = [
										{ id: taskAId, order: 1 },
										{ id: taskBId, order: 0 }
									];

									const response = await request(app)
										.put(`/api/columns/${INVALID_ID}/tasks/order`)
										.set('Authorization', `Bearer ${authToken}`)
										.send({ taskOrder: order });

									expect(response.status).toBe(400);
									expect(response.body.error.message).toBe("Invalid column id.");
								});

								it('returns 404 if column not found', async () => {
									const order = [
										{ id: taskAId, order: 1 },
										{ id: taskBId, order: 0 }
									];

									const response = await request(app)
										.put(`/api/columns/${NOT_FOUND_ID}/tasks/order`)
										.set('Authorization', `Bearer ${authToken}`)
										.send({ taskOrder: order });

									expect(response.status).toBe(404);
									expect(response.body.error.message).toBe("Column not found.");
								});

								it('returns 401 if token is invalid', async () => {
									const order = [
										{ id: taskAId, order: 1 },
										{ id: taskBId, order: 0 }
									];

									const response = await request(app)
										.put(`/api/columns/${columnId}/tasks/order`)
										.set('Authorization', `Bearer INVALID_TOKEN`)
										.send({ taskOrder: order });

									expect(response.status).toBe(401);
									expect(response.body.error.message).toBe("Authentication token is invalid.");
								});

								it('returns 401 if token is missing', async () => {
									const order = [
										{ id: taskAId, order: 1 },
										{ id: taskBId, order: 0 }
									];
									
									const response = await request(app)
										.put(`/api/columns/${columnId}/tasks/order`)
										.send({ taskOrder: order });

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

							describe('on get column', () => {
								it('returns 403 if user is not a member of the project that contains the board', async () => {
									const response = await request(app)
										.get(`/api/columns/${columnId}`)
										.set('Authorization', `Bearer ${authToken}`);

									expect(response.status).toBe(403);
									expect(response.body.error.message).toBe("You do not have access to this project.");
								});
							});

							describe('on edit column', () => {
								it('returns 403 if user is not a member of the project that contains the board', async () => {
									const response = await request(app)
										.put(`/api/columns/${columnId}`)
										.set('Authorization', `Bearer ${authToken}`)
										.send({ name: "Updated Board A" });

									expect(response.status).toBe(403);
									expect(response.body.error.message).toBe("You do not have access to this project.");
								});
							});

							describe('on delete column', () => {
								it('returns 403 if user is not a member of the project that contains the board', async () => {
									const response = await request(app)
										.delete(`/api/columns/${columnId}`)
										.set('Authorization', `Bearer ${authToken}`);

									expect(response.status).toBe(403);
									expect(response.body.error.message).toBe("You do not have access to this project.");
								});
							});

							describe('on add task to column', () => {
								it('returns 403 if user is not a member of the project that contains the board', async () => {
									const response = await request(app)
										.post(`/api/columns/${columnId}/tasks`)
										.set('Authorization', `Bearer ${authToken}`)
										.send({ title: 'Task A' });

									expect(response.status).toBe(403);
									expect(response.body.error.message).toBe("You do not have access to this project.");
								});
							});

							describe('and column has multiple tasks', () => {
								let taskAId: number;
								let taskBId: number;

								beforeEach(async () => {
									let response = await request(app)
										.post(`/api/columns/${columnId}/tasks`)
										.set('Authorization', `Bearer ${authToken}`)
										.send({ title: 'Task A' });

									taskAId = response.body.id;

									response = await request(app)
										.post(`/api/columns/${columnId}/tasks`)
										.set('Authorization', `Bearer ${authToken}`)
										.send({ title: 'Task B' });

									taskBId = response.body.id;
								});

								describe('on edit task order', () => {
									const order = [
										{ id: taskAId, order: 2 },
										{ id: taskBId, order: 1 }
									];

									it('returns 403 if user is not a member of the project that contains the board', async () => {
										const response = await request(app)
											.put(`/api/columns/${columnId}/tasks/order`)
											.set('Authorization', `Bearer ${authToken}`)
											.send({ taskOrder: order });

										expect(response.status).toBe(403);
										expect(response.body.error.message).toBe("You do not have access to this project.");
									});
								});
							});
						});

						describe('and project has at least one non-ADMIN member', () => {
							beforeEach(async () => {
								await request(app)
									.post(`/api/projects/${projectId}/members`)
									.set('Authorization', `Bearer ${authToken}`)
									.send({ userId: aliceUserId })
							});

							describe('and non-ADMIN is logged in', () => {
								beforeEach(async () => {
									const response = await request(app)
										.post('/api/auth/login')
										.send({
											username: 'alice',
											password: 'password123',
										});

									authToken = response.body.token;
								});

								describe('on update column', () => {
									it('returns 403 if user is not an admin of the project that contains the board', async () => {
										const response = await request(app)
											.put(`/api/columns/${columnId}`)
											.set('Authorization', `Bearer ${authToken}`)
											.send({ name: "Updated Column A" });

										expect(response.status).toBe(403);
										expect(response.body.error.message).toBe("You must be a project admin to perform this action.");
									});
								});

								describe('on delete column', () => {
									it('returns 403 if user is not an admin of the project that contains the board', async () => {
										const response = await request(app)
											.delete(`/api/columns/${columnId}`)
											.set('Authorization', `Bearer ${authToken}`);

										expect(response.status).toBe(403);
										expect(response.body.error.message).toBe("You must be a project admin to perform this action.");
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