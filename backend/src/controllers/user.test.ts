import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';

import { app } from '../app.js';
import { clearDatabase, INVALID_ID, NOT_FOUND_ID } from '../helpers/database.js';

describe('User API', () => {
	let authToken: string;
	let johnUserId: number;
	let aliceUserId: number;

	beforeEach(async () => {
		await clearDatabase();
	});

	describe('when users exist in database', () => {
		beforeEach(async () => {
			const johnResponse = await request(app)
				.post('/api/auth/register')
				.send({
					username: 'john',
					email: 'john@test.com',
					password: 'password123',
				});

			johnUserId = johnResponse.body.id;

			const aliceResponse = await request(app)
				.post('/api/auth/register')
				.send({
					username: 'alice',
					email: 'alice@test.com',
					password: 'password123',
				});

			aliceUserId = aliceResponse.body.id;

			const response = await request(app)
				.post('/api/auth/login')
				.send({
					username: 'john',
					password: 'password123',
				});

			authToken = response.body.token
		});

		describe('GET /api/users', () => {
			it('returns all users', async () => {
				const response = await request(app)
					.get('/api/users')
					.set('Authorization', `Bearer ${authToken}`);

				expect(response.status).toBe(200);
				expect(response.body).toHaveLength(2);
				expect(response.body).toEqual(
					expect.arrayContaining([
						expect.objectContaining({ username: 'john', email: 'john@test.com' }),
						expect.objectContaining({ username: 'alice', email: 'alice@test.com' })
					])
				);
			});

			it('rejects request without token', async () => {
				const response = await request(app)
					.get('/api/users');

				expect(response.status).toBe(401);
				expect(response.body.error.message).toEqual('Authentication token is missing.');
			});

			it('rejects invalid token', async () => {
				const response = await request(app)
					.get('/api/users')
					.set('Authorization', 'Bearer invalid-token');

				expect(response.status).toBe(401);
				expect(response.body.error.message).toBe('Authentication token is invalid.');
			});
		});

		describe('GET /api/users/:id', () => {
			it('returns user by id', async () => {
				const response = await request(app)
					.get(`/api/users/${aliceUserId}`)
					.set('Authorization', `Bearer ${authToken}`);

				expect(response.status).toBe(200);
				expect(response.body).toEqual({
					id: aliceUserId,
					username: 'alice',
					email: 'alice@test.com',
				});
			});


			it('returns 400 for invalid user id', async () => {
				const response = await request(app)
					.get(`/api/users/${INVALID_ID}`)
					.set('Authorization', `Bearer ${authToken}`);

				expect(response.status).toBe(400);
				expect(response.body.error.message).toEqual('Invalid user id.');
			});


			it('returns 404 when user does not exist', async () => {
				const response = await request(app)
					.get(`/api/users/${NOT_FOUND_ID}`)
					.set('Authorization', `Bearer ${authToken}`);

				expect(response.status).toBe(404);
				expect(response.body.error.message).toEqual('Could not find user with that id.');
			});
		});
	});
});