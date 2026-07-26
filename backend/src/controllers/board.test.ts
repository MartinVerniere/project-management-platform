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
					const responseA = await request(app)
						.post('/api/projects')
						.set('Authorization', `Bearer ${authToken}`)
						.send({
							name: 'Test 1',
							key: 'TEST1',
							description: 'test desc'
						});

					projectId = responseA.body.id;
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

					describe('on get board by id', async () => {
						it('returns board', async () => {
							const response = await request(app)
								.get(`/api/boards/${boardId}`)
								.set('Authorization', `Bearer ${authToken}`);

							expect(response.status).toBe(200);
							expect(response.body.name).toBe('Board A');
						});

						it('returns 400 if invalid board id', async () => {
							const response = await request(app)
								.get(`/api/boards/${INVALID_ID}`)
								.set('Authorization', `Bearer ${authToken}`);

							expect(response.status).toBe(400);
							expect(response.body.error.message).toBe("Invalid board id.");
						});

						it('returns 404 if board not found', async () => {
							const response = await request(app)
								.get(`/api/boards/${NOT_FOUND_ID}`)
								.set('Authorization', `Bearer ${authToken}`);

							expect(response.status).toBe(404);
							expect(response.body.error.message).toBe("Board not found.");
						});

						it('returns 401 if token is invalid', async () => {
							const response = await request(app)
								.get(`/api/boards/${boardId}`)
								.set('Authorization', `Bearer INVALID_TOKEN`);

							expect(response.status).toBe(401);
							expect(response.body.error.message).toBe("Authentication token is invalid.");
						});

						it('returns 401 if token is missing', async () => {
							const response = await request(app)
								.get(`/api/boards/${boardId}`);

							expect(response.status).toBe(401);
							expect(response.body.error.message).toBe("Authentication token is missing.");
						});
					});

					describe('on update board', async () => {
						it('updates board', async () => {
							const response = await request(app)
								.put(`/api/boards/${boardId}`)
								.set('Authorization', `Bearer ${authToken}`)
								.send({ name: "Updated Board A" });

							expect(response.status).toBe(200);
							expect(response.body.name).toBe('Updated Board A');
						});

						it('returns 400 if invalid board id', async () => {
							const response = await request(app)
								.put(`/api/boards/${INVALID_ID}`)
								.set('Authorization', `Bearer ${authToken}`)
								.send({ name: "Updated Board A" });

							expect(response.status).toBe(400);
							expect(response.body.error.message).toBe("Invalid board id.");
						});

						it('returns 404 if board not found', async () => {
							const response = await request(app)
								.put(`/api/boards/${NOT_FOUND_ID}`)
								.set('Authorization', `Bearer ${authToken}`)
								.send({ name: "Updated Board A" });

							expect(response.status).toBe(404);
							expect(response.body.error.message).toBe("Board not found.");
						});

						it('returns 400 when missing field name in request', async () => {
							const response = await request(app)
								.put(`/api/boards/${boardId}`)
								.set('Authorization', `Bearer ${authToken}`)
								.send({});

							expect(response.status).toBe(400);
							expect(response.body.error.message).toBe("Board name is required.");
						});

						it('returns 400 when field name is invalid', async () => {
							const response = await request(app)
								.put(`/api/boards/${boardId}`)
								.set('Authorization', `Bearer ${authToken}`)
								.send({ name: 5 });

							expect(response.status).toBe(400);
							expect(response.body.error.message).toBe("Board name must be a string.");
						});

						it('returns 400 when name is empty string', async () => {
							const response = await request(app)
								.put(`/api/boards/${boardId}`)
								.set('Authorization', `Bearer ${authToken}`)
								.send({ name: "" });

							expect(response.status).toBe(400);
							expect(response.body.error.message).toBe("Board name is required.");
						});

						it('returns 401 if token is invalid', async () => {
							const response = await request(app)
								.put(`/api/boards/${boardId}`)
								.set('Authorization', `Bearer INVALID_TOKEN`)
								.send({ name: "Updated Board A" });

							expect(response.status).toBe(401);
							expect(response.body.error.message).toBe("Authentication token is invalid.");
						});

						it('returns 401 if token is missing', async () => {
							const response = await request(app)
								.put(`/api/boards/${boardId}`)

							expect(response.status).toBe(401);
							expect(response.body.error.message).toBe("Authentication token is missing.");
						});
					});

					describe('on delete board', async () => {
						it('deletes board', async () => {
							const response = await request(app)
								.delete(`/api/boards/${boardId}`)
								.set('Authorization', `Bearer ${authToken}`);

							expect(response.status).toBe(204);
						});

						it('returns 400 if invalid board id', async () => {
							const response = await request(app)
								.delete(`/api/boards/${INVALID_ID}`)
								.set('Authorization', `Bearer ${authToken}`);

							expect(response.status).toBe(400);
							expect(response.body.error.message).toBe("Invalid board id.");
						});

						it('returns 404 if board not found', async () => {
							const response = await request(app)
								.delete(`/api/boards/${NOT_FOUND_ID}`)
								.set('Authorization', `Bearer ${authToken}`);

							expect(response.status).toBe(404);
							expect(response.body.error.message).toBe("Board not found.");
						});

						it('returns 401 if token is invalid', async () => {
							const response = await request(app)
								.delete(`/api/boards/${boardId}`)
								.set('Authorization', `Bearer INVALID_TOKEN`);

							expect(response.status).toBe(401);
							expect(response.body.error.message).toBe("Authentication token is invalid.");
						});

						it('returns 401 if token is missing', async () => {
							const response = await request(app)
								.delete(`/api/boards/${boardId}`);

							expect(response.status).toBe(401);
							expect(response.body.error.message).toBe("Authentication token is missing.");
						});
					});

					describe('on add column to board', () => {
						it('adds column', async () => {
							const response = await request(app)
								.post(`/api/boards/${boardId}/columns`)
								.set('Authorization', `Bearer ${authToken}`)
								.send({ name: 'Column A' });

							expect(response.status).toBe(201);
							expect(response.body.name).toBe('Column A');
						});

						it('returns 400 if missing field name in request', async () => {
							const response = await request(app)
								.post(`/api/boards/${boardId}/columns`)
								.set('Authorization', `Bearer ${authToken}`)
								.send({});

							expect(response.status).toBe(400);
							expect(response.body.error.message).toBe("Column name is required.");
						});

						it('returns 400 if column name is not a string', async () => {
							const response = await request(app)
								.post(`/api/boards/${boardId}/columns`)
								.set('Authorization', `Bearer ${authToken}`)
								.send({ name: 5 });

							expect(response.status).toBe(400);
							expect(response.body.error.message).toBe("Column name must be a string.");
						});

						it('returns 400 if column name is empty string', async () => {
							const response = await request(app)
								.post(`/api/boards/${boardId}/columns`)
								.set('Authorization', `Bearer ${authToken}`)
								.send({ name: " " });

							expect(response.status).toBe(400);
							expect(response.body.error.message).toBe("Column name is required.");
						});

						it('returns 400 if invalid board id', async () => {
							const response = await request(app)
								.post(`/api/boards/${INVALID_ID}/columns`)
								.set('Authorization', `Bearer ${authToken}`)
								.send({ name: "Updated Column A" });

							expect(response.status).toBe(400);
							expect(response.body.error.message).toBe("Invalid board id.");
						});

						it('returns 404 if board not found', async () => {
							const response = await request(app)
								.post(`/api/boards/${NOT_FOUND_ID}/columns`)
								.set('Authorization', `Bearer ${authToken}`)
								.send({ name: "Updated Board A" });

							expect(response.status).toBe(404);
							expect(response.body.error.message).toBe("Board not found.");
						});

						it('returns 401 if token is invalid', async () => {
							const response = await request(app)
								.post(`/api/boards/${boardId}/columns`)
								.set('Authorization', `Bearer INVALID_TOKEN`)
								.send({ name: "Updated Board A" });

							expect(response.status).toBe(401);
							expect(response.body.error.message).toBe("Authentication token is invalid.");
						});

						it('returns 401 if token is missing', async () => {
							const response = await request(app)
								.post(`/api/boards/${boardId}/columns`)

							expect(response.status).toBe(401);
							expect(response.body.error.message).toBe("Authentication token is missing.");
						});
					});

					describe('and board has at one column', () => {
						let columnAId: number;
						let columnBId: number;

						beforeEach(async () => {
							const responseA = await request(app)
								.post(`/api/boards/${boardId}/columns`)
								.set('Authorization', `Bearer ${authToken}`)
								.send({ name: 'Column A' });

							columnAId = responseA.body.id;

							const responseB = await request(app)
								.post(`/api/boards/${boardId}/columns`)
								.set('Authorization', `Bearer ${authToken}`)
								.send({ name: 'Column B' });

							columnBId = responseB.body.id;
						});

						describe('on add column', () => {
							it('returns 409 if a column with that name already exists in board', async () => {
								const response = await request(app)
									.post(`/api/boards/${boardId}/columns`)
									.set('Authorization', `Bearer ${authToken}`)
									.send({ name: 'Column A' });

								expect(response.status).toBe(409);
								expect(response.body.error.message).toBe('A column with this name already exists in the board.');
							});
						});

						describe('on edit column order', () => {
							it('orders columns', async () => {
								const order = [
									{ id: columnAId, order: 2 },
									{ id: columnBId, order: 1 }
								];

								const response = await request(app)
									.put(`/api/boards/${boardId}/columns/order`)
									.set('Authorization', `Bearer ${authToken}`)
									.send({ columnOrder: order });

								expect(response.status).toBe(200);
								expect(response.body.columns[0].name).toBe("Column B");
								expect(response.body.columns[1].name).toBe("Column A");
							});

							it('returns 400 if column order is missing', async () => {
								const response = await request(app)
									.put(`/api/boards/${boardId}/columns/order`)
									.set('Authorization', `Bearer ${authToken}`)
									.send({});

								expect(response.status).toBe(400);
								expect(response.body.error.message).toBe("Column order is required.");
							});

							it('returns 400 if invalid column order (is not an array)', async () => {
								const order = { id: columnAId, order: 2 };

								const response = await request(app)
									.put(`/api/boards/${boardId}/columns/order`)
									.set('Authorization', `Bearer ${authToken}`)
									.send({ columnOrder: order });

								expect(response.status).toBe(400);
								expect(response.body.error.message).toBe("Column order must be an array.");
							});

							it('returns 400 if missing columns in order', async () => {
								const order = [{ id: columnAId, order: 2 }];

								const response = await request(app)
									.put(`/api/boards/${boardId}/columns/order`)
									.set('Authorization', `Bearer ${authToken}`)
									.send({ columnOrder: order });

								expect(response.status).toBe(400);
								expect(response.body.error.message).toBe("Every board column must be included.");
							});

							it('returns 400 if one of the columns in the order has invalid id', async () => {
								const order = [
									{ id: INVALID_ID, order: 2 },
									{ id: columnBId, order: 1 }
								];

								const response = await request(app)
									.put(`/api/boards/${boardId}/columns/order`)
									.set('Authorization', `Bearer ${authToken}`)
									.send({ columnOrder: order });

								expect(response.status).toBe(400);
								expect(response.body.error.message).toBe("Invalid column id.");
							});

							it('returns 400 if one of the columns in the order has invalid order', async () => {
								const order = [
									{ id: columnAId, order: 'abc' },
									{ id: columnBId, order: 1 }
								];

								const response = await request(app)
									.put(`/api/boards/${boardId}/columns/order`)
									.set('Authorization', `Bearer ${authToken}`)
									.send({ columnOrder: order });

								expect(response.status).toBe(400);
								expect(response.body.error.message).toBe("Invalid column order.");
							});

							it('returns 400 if one of the columns in the order does not belong to the board', async () => {
								const order = [
									{ id: NOT_FOUND_ID, order: 2 },
									{ id: columnBId, order: 1 }
								];

								const response = await request(app)
									.put(`/api/boards/${boardId}/columns/order`)
									.set('Authorization', `Bearer ${authToken}`)
									.send({ columnOrder: order });

								expect(response.status).toBe(400);
								expect(response.body.error.message).toBe("Column does not belong to this board.");
							});

							it('returns 400 if invalid board id', async () => {
								const order = [
									{ id: columnAId, order: 2 },
									{ id: columnBId, order: 1 }
								];

								const response = await request(app)
									.put(`/api/boards/${INVALID_ID}/columns/order`)
									.set('Authorization', `Bearer ${authToken}`)
									.send({ columnOrder: order });

								expect(response.status).toBe(400);
								expect(response.body.error.message).toBe("Invalid board id.");
							});

							it('returns 404 if board not found', async () => {
								const order = [
									{ id: columnAId, order: 2 },
									{ id: columnBId, order: 1 }
								];

								const response = await request(app)
									.put(`/api/boards/${NOT_FOUND_ID}/columns/order`)
									.set('Authorization', `Bearer ${authToken}`)
									.send({ columnOrder: order });

								expect(response.status).toBe(404);
								expect(response.body.error.message).toBe("Board not found.");
							});

							it('returns 401 if token is invalid', async () => {
								const order = [
									{ id: columnAId, order: 2 },
									{ id: columnBId, order: 1 }
								];

								const response = await request(app)
									.put(`/api/boards/${boardId}/columns/order`)
									.set('Authorization', `Bearer INVALID_TOKEN`)
									.send({ columnOrder: order });

								expect(response.status).toBe(401);
								expect(response.body.error.message).toBe("Authentication token is invalid.");
							});

							it('returns 401 if token is missing', async () => {
								const order = [
									{ id: columnAId, order: 2 },
									{ id: columnBId, order: 1 }
								];

								const response = await request(app)
									.put(`/api/boards/${boardId}/columns/order`)
									.send({ columnOrder: order });

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

						describe('on get project by id', () => {
							it('returns 403 if user is not a member of the project that contains the board', async () => {
								const response = await request(app)
									.get(`/api/boards/${boardId}`)
									.set('Authorization', `Bearer ${authToken}`);

								expect(response.status).toBe(403);
								expect(response.body.error.message).toBe("You do not have access to this project.");
							});
						});

						describe('on update board', () => {
							it('returns 403 if user is not a member of the project that contains the board', async () => {
								const response = await request(app)
									.put(`/api/boards/${boardId}`)
									.set('Authorization', `Bearer ${authToken}`)
									.send({ name: "Updated Board A" });

								expect(response.status).toBe(403);
								expect(response.body.error.message).toBe("You do not have access to this project.");
							});
						});

						describe('on delete board', () => {
							it('returns 403 if user is not a member of the project that contains the board', async () => {
								const response = await request(app)
									.delete(`/api/boards/${boardId}`)
									.set('Authorization', `Bearer ${authToken}`);

								expect(response.status).toBe(403);
								expect(response.body.error.message).toBe("You do not have access to this project.");
							});
						});

						describe('on add column to board', () => {
							it('returns 403 if user is not a member of the project that contains the board', async () => {
								const response = await request(app)
									.post(`/api/boards/${boardId}/columns`)
									.set('Authorization', `Bearer ${authToken}`)
									.send({ name: 'Column A' });

								expect(response.status).toBe(403);
								expect(response.body.error.message).toBe("You do not have access to this project.");
							});
						});

						describe('and board has at least multiple columns', () => {
							let columnAId: number;
							let columnBId: number;

							beforeEach(async () => {
								const responseA = await request(app)
									.post(`/api/boards/${boardId}/columns`)
									.set('Authorization', `Bearer ${authToken}`)
									.send({ name: 'Column B' });

								columnAId = responseA.body.id;

								const responseB = await request(app)
									.post(`/api/boards/${boardId}/columns`)
									.set('Authorization', `Bearer ${authToken}`)
									.send({ name: 'Column B' });

								columnBId = responseB.body.id;
							});

							describe('on update column order', () => {
								it('returns 403 if user is not a member of the project that contains the board', async () => {
									const order = [
										{ id: columnAId, order: 2 },
										{ id: columnBId, order: 1 }
									];

									const response = await request(app)
										.put(`/api/boards/${boardId}/columns/order`)
										.set('Authorization', `Bearer ${authToken}`)
										.send({ columnOrder: order });

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

						describe('and non-ADMIN member is logged in', () => {
							beforeEach(async () => {
								const response = await request(app)
									.post('/api/auth/login')
									.send({
										username: 'alice',
										password: 'password123',
									});

								authToken = response.body.token;
							});

							describe('on delete board', () => {
								it('returns 403 if user is not an admin of the project that contains the board', async () => {
									const response = await request(app)
										.delete(`/api/boards/${boardId}`)
										.set('Authorization', `Bearer ${authToken}`);

									expect(response.status).toBe(403);
									expect(response.body.error.message).toBe("You must be a project admin to perform this action.");
								});
							});

							describe('on add column to board', () => {
								it('returns 403 if user is not an admin of the project that contains the board', async () => {
									const response = await request(app)
										.post(`/api/boards/${boardId}/columns`)
										.set('Authorization', `Bearer ${authToken}`)
										.send({ name: 'Column A' });

									expect(response.status).toBe(403);
									expect(response.body.error.message).toBe("You must be a project admin to perform this action.");
								});
							});

							describe('and board has at least multiple columns', () => {
								let columnAId: number;
								let columnBId: number;

								beforeEach(async () => {
									const responseA = await request(app)
										.post(`/api/boards/${boardId}/columns`)
										.set('Authorization', `Bearer ${authToken}`)
										.send({ name: 'Column B' });

									columnAId = responseA.body.id;

									const responseB = await request(app)
										.post(`/api/boards/${boardId}/columns`)
										.set('Authorization', `Bearer ${authToken}`)
										.send({ name: 'Column B' });

									columnBId = responseB.body.id;
								});

								describe('on edit column order', () => {
									it('returns 403 if user is not an admin of the project that contains the board', async () => {
										const order = [
											{ id: columnAId, order: 2 },
											{ id: columnBId, order: 1 }
										];

										const response = await request(app)
											.put(`/api/boards/${boardId}/columns/order`)
											.set('Authorization', `Bearer ${authToken}`)
											.send({ columnOrder: order });

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