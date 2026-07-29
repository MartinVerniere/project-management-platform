import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';

import { app } from '../app.js';
import { clearDatabase, INVALID_ID, NOT_FOUND_ID } from '../helpers/database.js';
import { addMember, createBoard, createColumn, createProject, loginUser, registerUser } from '../helpers/test.js';

describe('Board API', () => {
	beforeEach(async () => {
		await clearDatabase();
	});

	describe('when a board exists in the database', () => {
		let authToken: string;
		let boardId: number;

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
			boardId = board.id;
		});

		describe('and ADMIN is logged in', async () => {
			beforeEach(async () => {
				const admin = await loginUser('john', 'password123');
				authToken = admin.token;
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

			describe('and board has one column', () => {
				beforeEach(async () => {
					const columnA = await createColumn(authToken, boardId, 'Column A');
				});

				describe('on add column to board', () => {
					it('returns 409 if a column with that name already exists in board', async () => {
						const response = await request(app)
							.post(`/api/boards/${boardId}/columns`)
							.set('Authorization', `Bearer ${authToken}`)
							.send({ name: 'Column A' });

						expect(response.status).toBe(409);
						expect(response.body.error.message).toBe('A column with this name already exists in the board.');
					});
				});
			});

			describe('and board has multiple columns', () => {
				let columnAId: number;
				let columnBId: number;

				beforeEach(async () => {
					const columnA = await createColumn(authToken, boardId, 'Column A');
					columnAId = columnA.id;

					const columnB = await createColumn(authToken, boardId, 'Column B');
					columnBId = columnB.id;
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
		});

		describe('and MEMBER is logged in', async () => {
			beforeEach(async () => {
				const member = await loginUser('alice', 'password123');
				authToken = member.token;
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

			describe('on update board', () => {
				it('returns 403 if user is not an admin of the project that contains the board', async () => {
					const response = await request(app)
						.put(`/api/boards/${boardId}`)
						.set('Authorization', `Bearer ${authToken}`)
						.send({ name: "Updated Board A" });

					expect(response.status).toBe(403);
					expect(response.body.error.message).toBe("You must be a project admin to perform this action.");
				});
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

			describe('and board has multiple columns', () => {
				let columnAId: number;
				let columnBId: number;

				beforeEach(async () => {
					const columnA = await createColumn(authToken, boardId, 'Column A');
					columnAId = columnA.id;

					const columnB = await createColumn(authToken, boardId, 'Column B');
					columnBId = columnB.id;
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

		describe('and non-MEMBER is logged in', async () => {
			beforeEach(async () => {
				const nonMember = await loginUser('martin', 'password123');
				authToken = nonMember.token;
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
					const columnA = await createColumn(authToken, boardId, 'Column A');
					columnAId = columnA.id;

					const columnB = await createColumn(authToken, boardId, 'Column B');
					columnBId = columnB.id;
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
	});
});