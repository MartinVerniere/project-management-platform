import jwt from 'jsonwebtoken';
import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import request from 'supertest';

import { prisma } from '../prisma.js';
import { SECRET } from '../utils/config.js';
import { app } from '../app.js';
import { clearDatabase, NOT_FOUND_ID } from '../helpers/database.js';

describe('Auth API', () => {
	beforeEach(async () => {
		await clearDatabase();
	});

	it('returns 400 when username is missing', async () => {
		const response = await request(app)
			.post('/api/auth/register')
			.send({
				email: 'test@test.com',
				password: 'password123',
			});

		expect(response.status).toBe(400);
		expect(response.body.error.message).toBe('Username is required.');
	});

	it('returns 400 when email is missing', async () => {
		const response = await request(app)
			.post('/api/auth/register')
			.send({
				username: 'john',
				password: 'password123',
			});

		expect(response.status).toBe(400);
		expect(response.body.error.message).toBe('Email is required.');
	});

	it('returns 400 when password is missing', async () => {
		const response = await request(app)
			.post('/api/auth/register')
			.send({
				username: 'john',
				email: 'test@test.com',
			});

		expect(response.status).toBe(400);
		expect(response.body.error.message).toBe('Password is required.');
	});

	it('returns 400 when password too short', async () => {
		const response = await request(app)
			.post('/api/auth/register')
			.send({
				username: 'john',
				email: 'test@test.com',
				password: '123',
			});

		expect(response.status).toBe(400);
		expect(response.body.error.message).toBe('Password must be at least 8 characters long.');
	});

	describe('when no user exists', () => {
		describe('on register', () => {
			it('creates user successfully', async () => {
				const response = await request(app)
					.post('/api/auth/register')
					.send({
						username: 'john',
						email: 'john@test.com',
						password: 'password123',
					});

				expect(response.status).toBe(201);
				expect(response.body.username).toBe('john');

				const user = await prisma.user.findUnique({
					where: {
						email: 'john@test.com',
					},
				});

				expect(user).not.toBeNull();
				expect(user?.username).toBe('john');
			});
		});
		describe('on login', () => {
			it('returns 401 when user not found', async () => {
				const response = await request(app)
					.post('/api/auth/login')
					.send({
						username: 'thomas',
						password: 'password123',
					});

				expect(response.status).toBe(401);
				expect(response.body.error.message).toBe("Invalid username or password.");
			});
		});
	});

	describe('when a user exists', () => {
		let userId: number;

		beforeEach(async () => {
			const response = await request(app)
				.post('/api/auth/register')
				.send({
					username: 'john',
					email: 'john@test.com',
					password: 'password123',
				});

			userId = response.body.id;
		});

		describe('on register', () => {
			it('blocks duplicate username', async () => {
				const response = await request(app)
					.post('/api/auth/register')
					.send({
						username: 'john',
						email: 'other@test.com',
						password: 'password123',
					});

				expect(response.status).toBe(409);
				expect(response.body.error.message).toBe('Username is already taken.');
			});

			it('blocks duplicate email', async () => {
				const response = await request(app)
					.post('/api/auth/register')
					.send({
						username: 'alice',
						email: 'john@test.com',
						password: 'password123',
					});

				expect(response.status).toBe(409);
				expect(response.body.error.message).toBe('Email is already taken.');
			});
		});

		describe('on login', () => {
			it('returns 401 when password is wrong', async () => {
				const response = await request(app)
					.post('/api/auth/login')
					.send({
						username: 'john',
						password: 'wrongpassword',
					});

				expect(response.status).toBe(401);
				expect(response.body.error.message).toBe("Invalid username or password.");
			});

			it('returns token on success', async () => {
				const response = await request(app)
					.post('/api/auth/login')
					.send({
						username: 'john',
						password: 'password123',
					});

				expect(response.status).toBe(200);
				expect(response.body.token).toBeDefined();

				const decoded = jwt.verify(response.body.token, SECRET!);
				expect((decoded as any).username).toBe('john');
			});
		});

		describe('on me', () => {
			it('returns current user', async () => {
				const token = jwt.sign(
					{ id: userId, username: 'john' },
					SECRET!,
					{ expiresIn: '1h' }
				);

				const response = await request(app)
					.get('/api/auth/me')
					.set('Authorization', `Bearer ${token}`);

				expect(response.status).toBe(200);
				expect(response.body.id).toBe(userId);
				expect(response.body.username).toBe('john');
			});

			it('fails when no token provided', async () => {
				const response = await request(app)
					.get('/api/auth/me');

				expect(response.status).toBe(401);
				expect(response.body.error.message).toBe('Authentication token is missing.');
			});

			it('fails when token decoding fails', async () => {
				const token = jwt.sign(
					{ id: NOT_FOUND_ID, username: 'john' },
					'wrongSecret',
					{ expiresIn: '1h' }
				);

				const response = await request(app)
					.get('/api/auth/me')
					.set('Authorization', `Bearer ${token}`);

				expect(response.status).toBe(401);
				expect(response.body.error.message).toBe('Authentication token is invalid.');
			});
		});
	});
});