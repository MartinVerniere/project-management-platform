import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';

import { app } from '../app.js';
import { clearDatabase, INVALID_ID, NOT_FOUND_ID } from '../helpers/database.js';
import { registerUser, loginUser } from '../helpers/test.js';

describe('User API', () => {
	let authToken: string;
	let aliceId: number;

	beforeEach(async () => {
		await clearDatabase();
	});

	describe('when a user is logged in', () => {
		beforeEach(async () => {
			//Create user
			const john = await registerUser('john', 'john@test.com', 'password123');
			const alice = await registerUser('alice', 'alice@test.com', 'password123');
			aliceId = alice.id;
			const martin = await registerUser('martin', 'martin@test.com', 'password123');

			//Login
			const login = await loginUser('john', 'password123');
			authToken = login.token;
		});

		describe('on get users', () => {
			it('returns users', async () => {
				const response = await request(app)
					.get('/api/users')
					.set('Authorization', `Bearer ${authToken}`);

				expect(response.status).toBe(200);
				expect(response.body).toHaveLength(3);
				expect(response.body).toEqual(
					expect.arrayContaining([
						expect.objectContaining({ username: 'john', email: 'john@test.com' }),
						expect.objectContaining({ username: 'alice', email: 'alice@test.com' }),
						expect.objectContaining({ username: 'martin', email: 'martin@test.com' })
					])
				);
			});

			it('returns 401 if token is invalid', async () => {
				const response = await request(app)
					.get('/api/users')
					.set('Authorization', `Bearer INVALID_TOKEN`);

				expect(response.status).toBe(401);
				expect(response.body.error.message).toBe("Authentication token is invalid.");
			});

			it('returns 401 if token is missing', async () => {
				const response = await request(app)
					.get('/api/users');

				expect(response.status).toBe(401);
				expect(response.body.error.message).toBe("Authentication token is missing.");
			});
		});

		describe('on get user by id', () => {
			it('returns user', async () => {
				const response = await request(app)
					.get(`/api/users/${aliceId}`)
					.set('Authorization', `Bearer ${authToken}`);

				expect(response.status).toBe(200);
				expect(response.body).toEqual({ id: aliceId, username: 'alice', email: 'alice@test.com' });
			});

			it('returns 400 if invalid user id', async () => {
				const response = await request(app)
					.get(`/api/users/${INVALID_ID}`)
					.set('Authorization', `Bearer ${authToken}`);

				expect(response.status).toBe(400);
				expect(response.body.error.message).toEqual('Invalid user id.');
			});

			it('returns 404 if user not found', async () => {
				const response = await request(app)
					.get(`/api/users/${NOT_FOUND_ID}`)
					.set('Authorization', `Bearer ${authToken}`);

				expect(response.status).toBe(404);
				expect(response.body.error.message).toEqual('User not found.');
			});

			it('returns 401 if token is invalid', async () => {
				const response = await request(app)
					.get(`/api/users/${aliceId}`)
					.set('Authorization', `Bearer INVALID_TOKEN`);

				expect(response.status).toBe(401);
				expect(response.body.error.message).toBe("Authentication token is invalid.");
			});

			it('returns 401 if token is missing', async () => {
				const response = await request(app)
					.get(`/api/users/${aliceId}`);

				expect(response.status).toBe(401);
				expect(response.body.error.message).toBe("Authentication token is missing.");
			});
		});
	});
});