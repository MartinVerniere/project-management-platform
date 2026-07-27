import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';

import { app } from '../app.js';
import { clearDatabase, INVALID_ID, NOT_FOUND_ID } from '../helpers/database.js';

describe('Comment API', () => {
	beforeEach(async () => {
		await clearDatabase();
	});

	describe('when a comment exists in database', () => {
		let johnUserId: number;
		let aliceUserId: number;
		let martinUserId: number;
		let authToken: string;
		let projectId: number;
		let boardId: number;
		let columnId: number;
		let taskId: number;
		let commentId: number;

		beforeEach(async () => {
			//Create users
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

			response = await request(app)
				.post('/api/auth/register')
				.send({
					username: 'martin',
					email: 'martin@test.com',
					password: 'password123',
				});

			martinUserId = response.body.id;

			//Login
			response = await request(app)
				.post('/api/auth/login')
				.send({
					username: 'john',
					password: 'password123',
				});

			authToken = response.body.token;

			//Create project
			response = await request(app)
				.post('/api/projects')
				.set('Authorization', `Bearer ${authToken}`)
				.send({
					name: 'Test 1',
					key: 'TEST1',
					description: 'test desc'
				});

			projectId = response.body.id;

			//Add member to project
			await request(app)
				.post(`/api/projects/${projectId}/members`)
				.set('Authorization', `Bearer ${authToken}`)
				.send({ userId: aliceUserId });

			//Create board
			response = await request(app)
				.post(`/api/projects/${projectId}/boards`)
				.set('Authorization', `Bearer ${authToken}`)
				.send({ name: 'Board A' });

			boardId = response.body.id;

			//Create column
			response = await request(app)
				.post(`/api/boards/${boardId}/columns`)
				.set('Authorization', `Bearer ${authToken}`)
				.send({ name: 'Column A' });

			columnId = response.body.id;

			//Create task
			response = await request(app)
				.post(`/api/columns/${columnId}/tasks`)
				.set('Authorization', `Bearer ${authToken}`)
				.send({ title: 'Task A', description: 'This is task A' });

			taskId = response.body.id;

			//Non-ADMIN member logs in
			response = await request(app)
				.post('/api/auth/login')
				.send({
					username: 'alice',
					password: 'password123',
				});

			authToken = response.body.token;

			//Create comment with non-ADMIN member
			response = await request(app)
				.post(`/api/tasks/${taskId}/comments`)
				.set('Authorization', `Bearer ${authToken}`)
				.send({ content: 'This is a good comment!' });

			commentId = response.body.id;
		});

		describe('and comment AUTHOR is logged in', () => {
			beforeEach(async () => {
				const response = await request(app)
					.post('/api/auth/login')
					.send({
						username: 'alice',
						password: 'password123',
					});

				authToken = response.body.token;
			});

			describe('on update comment', () => {
				it('updates comment', async () => {
					const response = await request(app)
						.put(`/api/comments/${commentId}`)
						.set('Authorization', `Bearer ${authToken}`)
						.send({ content: 'This is an updated comment!' });

					expect(response.status).toBe(200);
					expect(response.body.content).toBe('This is an updated comment!');
				});

				it('returns 400 if missing field content in request', async () => {
					const response = await request(app)
						.put(`/api/comments/${commentId}`)
						.set('Authorization', `Bearer ${authToken}`)
						.send({});

					expect(response.status).toBe(400);
					expect(response.body.error.message).toBe("Comment is required.");
				});

				it('returns 400 if comment content is not a string', async () => {
					const response = await request(app)
						.put(`/api/comments/${commentId}`)
						.set('Authorization', `Bearer ${authToken}`)
						.send({ content: 5 });

					expect(response.status).toBe(400);
					expect(response.body.error.message).toBe("Comment must be a string.");
				});

				it('returns 400 if comment content is an empty string', async () => {
					const response = await request(app)
						.put(`/api/comments/${commentId}`)
						.set('Authorization', `Bearer ${authToken}`)
						.send({ content: '' });

					expect(response.status).toBe(400);
					expect(response.body.error.message).toBe("Comment is required.");
				});

				it('returns 400 if invalid comment id', async () => {
					const response = await request(app)
						.put(`/api/comments/${INVALID_ID}`)
						.set('Authorization', `Bearer ${authToken}`)
						.send({ content: 'This is a comment!' });

					expect(response.status).toBe(400);
					expect(response.body.error.message).toBe("Invalid comment id.");
				});

				it('returns 404 if comment not found', async () => {
					const response = await request(app)
						.put(`/api/comments/${NOT_FOUND_ID}`)
						.set('Authorization', `Bearer ${authToken}`)
						.send({ content: 'This is a comment!' });

					expect(response.status).toBe(404);
					expect(response.body.error.message).toBe("Comment not found.");
				});

				it('returns 401 if token is invalid', async () => {
					const response = await request(app)
						.put(`/api/comments/${commentId}`)
						.set('Authorization', `Bearer INVALID_TOKEN`)
						.send({ content: 'This is a comment!' });

					expect(response.status).toBe(401);
					expect(response.body.error.message).toBe("Authentication token is invalid.");
				});

				it('returns 401 if token is missing', async () => {
					const response = await request(app)
						.put(`/api/comments/${commentId}`)
						.send({ content: 'This is a comment!' });

					expect(response.status).toBe(401);
					expect(response.body.error.message).toBe("Authentication token is missing.");
				});
			});

			describe('on delete comment', () => {
				it('deletes comment', async () => {
					const response = await request(app)
						.delete(`/api/comments/${commentId}`)
						.set('Authorization', `Bearer ${authToken}`);

					expect(response.status).toBe(204);
				});

				it('returns 400 if invalid comment id', async () => {
					const response = await request(app)
						.delete(`/api/comments/${INVALID_ID}`)
						.set('Authorization', `Bearer ${authToken}`);

					expect(response.status).toBe(400);
					expect(response.body.error.message).toBe("Invalid comment id.");
				});

				it('returns 404 if comment not found', async () => {
					const response = await request(app)
						.delete(`/api/comments/${NOT_FOUND_ID}`)
						.set('Authorization', `Bearer ${authToken}`);

					expect(response.status).toBe(404);
					expect(response.body.error.message).toBe("Comment not found.");
				});

				it('returns 401 if token is invalid', async () => {
					const response = await request(app)
						.delete(`/api/comments/${commentId}`)
						.set('Authorization', `Bearer INVALID_TOKEN`);

					expect(response.status).toBe(401);
					expect(response.body.error.message).toBe("Authentication token is invalid.");
				});

				it('returns 401 if token is missing', async () => {
					const response = await request(app)
						.delete(`/api/comments/${commentId}`);

					expect(response.status).toBe(401);
					expect(response.body.error.message).toBe("Authentication token is missing.");
				});
			});
		});

		describe('and project ADMIN is logged in', () => {
			beforeEach(async () => {
				const response = await request(app)
					.post('/api/auth/login')
					.send({
						username: 'john',
						password: 'password123',
					});

				authToken = response.body.token;
			});

			describe('on update comment', () => {
				it('updates comment', async () => {
					const response = await request(app)
						.put(`/api/comments/${commentId}`)
						.set('Authorization', `Bearer ${authToken}`)
						.send({ content: 'This is an updated comment!' });

					expect(response.status).toBe(200);
					expect(response.body.content).toBe('This is an updated comment!');
				});

				it('returns 400 if missing field content in request', async () => {
					const response = await request(app)
						.put(`/api/comments/${commentId}`)
						.set('Authorization', `Bearer ${authToken}`)
						.send({});

					expect(response.status).toBe(400);
					expect(response.body.error.message).toBe("Comment is required.");
				});

				it('returns 400 if comment content is not a string', async () => {
					const response = await request(app)
						.put(`/api/comments/${commentId}`)
						.set('Authorization', `Bearer ${authToken}`)
						.send({ content: 5 });

					expect(response.status).toBe(400);
					expect(response.body.error.message).toBe("Comment must be a string.");
				});

				it('returns 400 if comment content is an empty string', async () => {
					const response = await request(app)
						.put(`/api/comments/${commentId}`)
						.set('Authorization', `Bearer ${authToken}`)
						.send({ content: '' });

					expect(response.status).toBe(400);
					expect(response.body.error.message).toBe("Comment is required.");
				});

				it('returns 400 if invalid comment id', async () => {
					const response = await request(app)
						.put(`/api/comments/${INVALID_ID}`)
						.set('Authorization', `Bearer ${authToken}`)
						.send({ content: 'This is a comment!' });

					expect(response.status).toBe(400);
					expect(response.body.error.message).toBe("Invalid comment id.");
				});

				it('returns 404 if comment not found', async () => {
					const response = await request(app)
						.put(`/api/comments/${NOT_FOUND_ID}`)
						.set('Authorization', `Bearer ${authToken}`)
						.send({ content: 'This is a comment!' });

					expect(response.status).toBe(404);
					expect(response.body.error.message).toBe("Comment not found.");
				});

				it('returns 401 if token is invalid', async () => {
					const response = await request(app)
						.put(`/api/comments/${commentId}`)
						.set('Authorization', `Bearer INVALID_TOKEN`)
						.send({ content: 'This is a comment!' });

					expect(response.status).toBe(401);
					expect(response.body.error.message).toBe("Authentication token is invalid.");
				});

				it('returns 401 if token is missing', async () => {
					const response = await request(app)
						.put(`/api/comments/${commentId}`)
						.send({ content: 'This is a comment!' });

					expect(response.status).toBe(401);
					expect(response.body.error.message).toBe("Authentication token is missing.");
				});
			});

			describe('on delete comment', () => {
				it('deletes comment', async () => {
					const response = await request(app)
						.delete(`/api/comments/${commentId}`)
						.set('Authorization', `Bearer ${authToken}`);

					expect(response.status).toBe(204);
				});

				it('returns 400 if invalid comment id', async () => {
					const response = await request(app)
						.delete(`/api/comments/${INVALID_ID}`)
						.set('Authorization', `Bearer ${authToken}`);

					expect(response.status).toBe(400);
					expect(response.body.error.message).toBe("Invalid comment id.");
				});

				it('returns 404 if comment not found', async () => {
					const response = await request(app)
						.delete(`/api/comments/${NOT_FOUND_ID}`)
						.set('Authorization', `Bearer ${authToken}`);

					expect(response.status).toBe(404);
					expect(response.body.error.message).toBe("Comment not found.");
				});

				it('returns 401 if token is invalid', async () => {
					const response = await request(app)
						.delete(`/api/comments/${commentId}`)
						.set('Authorization', `Bearer INVALID_TOKEN`);

					expect(response.status).toBe(401);
					expect(response.body.error.message).toBe("Authentication token is invalid.");
				});

				it('returns 401 if token is missing', async () => {
					const response = await request(app)
						.delete(`/api/comments/${commentId}`);

					expect(response.status).toBe(401);
					expect(response.body.error.message).toBe("Authentication token is missing.");
				});
			});
		});

		describe('and non-AUTHOR and non-ADMIN is logged in', () => {
			beforeEach(async () => {
				const response = await request(app)
					.post('/api/auth/login')
					.send({
						username: 'martin',
						password: 'password123',
					});

				authToken = response.body.token;
			});

			describe('on get comment', () => {
				it('gets comment by id', async () => {
					const response = await request(app)
						.get(`/api/comments/${commentId}`)
						.set('Authorization', `Bearer ${authToken}`);

					expect(response.status).toBe(200);
					expect(response.body.content).toBe('This is a good comment!');
				});

				it('returns 400 if invalid comment id', async () => {
					const response = await request(app)
						.get(`/api/comments/${INVALID_ID}`)
						.set('Authorization', `Bearer ${authToken}`);

					expect(response.status).toBe(400);
					expect(response.body.error.message).toBe("Invalid comment id.");
				});

				it('returns 404 if comment not found', async () => {
					const response = await request(app)
						.get(`/api/comments/${NOT_FOUND_ID}`)
						.set('Authorization', `Bearer ${authToken}`);

					expect(response.status).toBe(404);
					expect(response.body.error.message).toBe("Comment not found.");
				});

				it('returns 401 if comment is invalid', async () => {
					const response = await request(app)
						.get(`/api/comments/${commentId}`)
						.set('Authorization', `Bearer INVALID_TOKEN`);

					expect(response.status).toBe(401);
					expect(response.body.error.message).toBe("Authentication token is invalid.");
				});

				it('returns 401 if token is missing', async () => {
					const response = await request(app)
						.get(`/api/comments/${commentId}`);

					expect(response.status).toBe(401);
					expect(response.body.error.message).toBe("Authentication token is missing.");
				});
			});

			describe('on update comment', () => {
				it('returns 403 if user is not the comment AUTHOR, or the ADMIN of the project that holds the comment', async () => {
					const response = await request(app)
						.put(`/api/comments/${commentId}`)
						.set('Authorization', `Bearer ${authToken}`)
						.send({ content: 'This is a comment!' });

					expect(response.status).toBe(403);
					expect(response.body.error.message).toBe("You do not have permission to edit this comment.");
				});
			});

			describe('on delete comment', () => {
				it('returns 403 if user is not the comment AUTHOR, or the ADMIN of the project that holds the comment', async () => {
					const response = await request(app)
						.delete(`/api/comments/${commentId}`)
						.set('Authorization', `Bearer ${authToken}`);

					expect(response.status).toBe(403);
					expect(response.body.error.message).toBe("You do not have permission to edit this comment.");
				});
			});
		});
	});
});