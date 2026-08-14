import jwt from 'jsonwebtoken';
import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';

import { prisma } from '../prisma.js';
import { SECRET } from '../utils/config.js';
import { app } from '../app.js';
import { clearDatabase } from '../helpers/database.js';
import { loginUser, registerUser } from '../helpers/test.js';

import { vi } from 'vitest';

const { uploadMock, getPublicUrlMock } = vi.hoisted(() => ({
	uploadMock: vi.fn(),
	getPublicUrlMock: vi.fn(() => ({ data: { publicUrl: 'https://example.com' } }))
}));

vi.mock('../services/supabase.js', () => ({
	supabase: {
		storage: {
			from: vi.fn(() => ({
				upload: uploadMock,
				getPublicUrl: getPublicUrlMock,
			})),
		},
	},
}));

describe('Auth API', () => {
	beforeEach(async () => {
		vi.clearAllMocks();
		uploadMock.mockResolvedValue({ data: { path: 'avatar.png' }, error: null });
		await clearDatabase();
	});

	describe('when no user exists in database', () => {
		describe('on register', () => {
			it('creates user successfully', async () => {
				const response = await request(app)
					.post('/api/auth/register')
					.send({ username: 'john', email: 'john@test.com', password: 'password123' });

				expect(response.status).toBe(201);
				expect(response.body.username).toBe('john');

				const user = await prisma.user.findUnique({ where: { email: 'john@test.com' } });

				expect(user).not.toBeNull();
				expect(response.body.avatarUrl).toBeNull();
				expect(user?.username).toBe('john');
			});

			it('creates user with avatar successfully', async () => {
				const response = await request(app)
					.post('/api/auth/register')
					.field('username', 'avataruser')
					.field('email', 'avatar@test.com')
					.field('password', 'password123')
					.attach('avatar', Buffer.from('fake image'), {
						filename: 'avatar.png',
						contentType: 'image/png',
					});

				expect(response.status).toBe(201);
				expect(response.body.username).toBe('avataruser');
				expect(response.body.avatarUrl).toBeDefined();
				expect(response.body.avatarUrl).not.toBeNull();

				const user = await prisma.user.findUnique({
					where: { email: 'avatar@test.com' },
				});

				expect(user).not.toBeNull();
				expect(user?.avatarUrl).toBe(response.body.avatarUrl);
			});

			it('returns 500 when avatar storage fails', async () => {
				uploadMock.mockResolvedValueOnce({
					data: null,
					error: new Error('Upload failed'),
				});
				
				const response = await request(app)
					.post('/api/auth/register')
					.field('username', 'avataruser')
					.field('email', 'avatar@test.com')
					.field('password', 'password123')
					.attach('avatar', Buffer.from('fake image'), {
						filename: 'avatar.png',
						contentType: 'image/png',
					});

				expect(response.status).toBe(500);
				expect(response.body.error.message).toBe('Failed storing avatar.');

				const user = await prisma.user.findUnique({
					where: { email: 'avatar@test.com' },
				});

				expect(user).toBeNull();
			});
		});
	});

	describe('when a user exists in database', async () => {
		let johnId: number;

		beforeEach(async () => {
			//Create users
			const john = await registerUser('john', 'john@test.com', 'password123');
			johnId = john.id;
		});

		describe('on login', () => {
			it('logs in and returns token', async () => {
				const response = await request(app)
					.post('/api/auth/login')
					.send({ username: 'john', password: 'password123' });

				expect(response.status).toBe(200);
				expect(response.body.token).toBeDefined();

				const decoded = jwt.verify(response.body.token, SECRET!);
				expect((decoded as any).username).toBe('john');
			});

			it('returns 400 when username is missing', async () => {
				const response = await request(app)
					.post('/api/auth/register')
					.send({ email: 'test@test.com', password: 'password123' });

				expect(response.status).toBe(400);
				expect(response.body.error.message).toBe('Username is required.');
			});

			it('returns 400 when email is missing', async () => {
				const response = await request(app)
					.post('/api/auth/register')
					.send({ username: 'john', password: 'password123' });

				expect(response.status).toBe(400);
				expect(response.body.error.message).toBe('Email is required.');
			});

			it('returns 400 when password is missing', async () => {
				const response = await request(app)
					.post('/api/auth/register')
					.send({ username: 'john', email: 'test@test.com' });

				expect(response.status).toBe(400);
				expect(response.body.error.message).toBe('Password is required.');
			});

			it('returns 400 when password too short', async () => {
				const response = await request(app)
					.post('/api/auth/register')
					.send({ username: 'john', email: 'test@test.com', password: '123' });

				expect(response.status).toBe(400);
				expect(response.body.error.message).toBe('Password must be at least 8 characters long.');
			});

			it('returns 401 when user not found', async () => {
				const response = await request(app)
					.post('/api/auth/login')
					.send({ username: 'NOT_FOUND_USER', password: 'password123' });

				expect(response.status).toBe(401);
				expect(response.body.error.message).toBe("Invalid username or password.");
			});

			it('returns 401 when password is wrong', async () => {
				const response = await request(app)
					.post('/api/auth/login')
					.send({ username: 'john', password: 'wrongpassword' });

				expect(response.status).toBe(401);
				expect(response.body.error.message).toBe("Invalid username or password.");
			});
		});

		describe('on register', () => {
			it('blocks duplicate username', async () => {
				const response = await request(app)
					.post('/api/auth/register')
					.send({ username: 'john', email: 'other@test.com', password: 'password123' });

				expect(response.status).toBe(409);
				expect(response.body.error.message).toBe('Username is already taken.');
			});

			it('blocks duplicate email', async () => {
				const response = await request(app)
					.post('/api/auth/register')
					.send({ username: 'alice', email: 'john@test.com', password: 'password123' });

				expect(response.status).toBe(409);
				expect(response.body.error.message).toBe('Email is already taken.');
			});
		});

		describe('and a user is logged in', () => {
			let authToken: string;

			beforeEach(async () => {
				//Login
				const login = await loginUser('john', 'password123');
				authToken = login.token;
			});

			describe('on me', () => {
				it('returns current user', async () => {
					const response = await request(app)
						.get('/api/auth/me')
						.set('Authorization', `Bearer ${authToken}`);

					expect(response.status).toBe(200);
					expect(response.body.id).toBe(johnId);
					expect(response.body.username).toBe('john');
				});

				it('returns 401 if token is invalid', async () => {
					const response = await request(app)
						.get('/api/auth/me')
						.set('Authorization', `Bearer INVALID_TOKEN`);

					expect(response.status).toBe(401);
					expect(response.body.error.message).toBe("Authentication token is invalid.");
				});

				it('returns 401 if token is missing', async () => {
					const response = await request(app)
						.get('/api/auth/me');

					expect(response.status).toBe(401);
					expect(response.body.error.message).toBe("Authentication token is missing.");
				});
			});
		});
	});
});