import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';

import { app } from '../app.js';
import { clearDatabase, INVALID_ID, NOT_FOUND_ID } from '../helpers/database.js';
import { addMember, createBoard, createColumn, createProject, createTask, loginUser, registerUser } from '../helpers/test.js';

describe('Column API', () => {
	beforeEach(async () => {
		await clearDatabase();
	});

	describe('when a column exists in the database', () => {
		let authToken: string;
		let columnId: number;

		beforeEach(async () => {
			//Create users
			const john = await registerUser('john', 'john@test.com', 'password123');
			const alice = await registerUser('alice', 'alice@test.com', 'password123');
			const martin = await registerUser('martin', 'martin@test.com', 'password123');

			//Login
			const login = await loginUser('john', 'password123');
			authToken = login.token;

			//Create project
			const project = await createProject(authToken, 'Test 1', 'TEST1', 'test desc');

			//Add member to project
			const member = await addMember(authToken, project.id, alice.id);

			//Create board
			const board = await createBoard(authToken, project.id, 'Board A');

			//Create column
			const column = await createColumn(authToken, board.id, 'Column A');
			columnId = column.id;
		});

		describe('and ADMIN is logged in', async () => {
			beforeEach(async () => {
				const admin = await loginUser('john', 'password123');
				authToken = admin.token;
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
		});

		describe('and MEMBER is logged in', async () => {
			beforeEach(async () => {
				const member = await loginUser('alice', 'password123');
				authToken = member.token;
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

			describe('and column has one task', () => {
				beforeEach(async () => {
					const task = await createTask(authToken, columnId, 'Task A', 'This is task A');
				});

				describe('on add task to column', () => {
					it('returns 409 if a task with that same title already exists in that column', async () => {
						const response = await request(app)
							.post(`/api/columns/${columnId}/tasks`)
							.set('Authorization', `Bearer ${authToken}`)
							.send({ title: 'Task A' });

						expect(response.status).toBe(409);
						expect(response.body.error.message).toBe("A task with this title already exists in the column.");
					});
				});
			});

			describe('and column has multiple tasks', () => {
				let taskAId: number;
				let taskBId: number;

				beforeEach(async () => {
					const taskA = await createTask(authToken, columnId, 'Task A', 'This is task A');
					taskAId = taskA.id;

					const taskB = await createTask(authToken, columnId, 'Task B', 'This is task B');
					taskBId = taskB.id;
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
		});

		describe('and non-MEMBER is logged in', async () => {
			beforeEach(async () => {
				const nonMember = await loginUser('martin', 'password123');
				authToken = nonMember.token;
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
					const taskA = await createTask(authToken, columnId, 'Task A', 'This is task A');
					taskAId = taskA.id;

					const taskB = await createTask(authToken, columnId, 'Task B', 'This is task B');
					taskBId = taskB.id;
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
	});
});