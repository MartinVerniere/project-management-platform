import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import type { Request, Response } from 'express';
import { Router } from 'express';
import { ApiError, tokenExtractor, userExtractor } from '../utils/middleware.js';
import { SECRET } from '../utils/config.js';
import { prisma } from '../prisma.js';
import type { User } from '../generated/prisma/client.js';
import type { LoginResponse, UserResponse } from '../models/user.js';

const authRouter: Router = Router();

authRouter.post('/register', async (request: Request, response: Response) => {
	const { username, email, password } = request.body;

	if (!username) throw new ApiError(400, "USERNAME_REQUIRED", "Username is required.");
	if (!email) throw new ApiError(400, "EMAIL_REQUIRED", "Email is required.");
	if (!password) throw new ApiError(400, "PASSWORD_REQUIRED", "Password is required.");
	if (password.length < 8) throw new ApiError(400, "PASSWORD_TOO_SHORT", "Password must be at least 8 characters long.");

	const usernameTaken: UserResponse | null = await prisma.user.findUnique({ where: { username } });
	if (usernameTaken) throw new ApiError(409, "USERNAME_TAKEN", "Username is already taken.");

	const emailTaken: UserResponse | null = await prisma.user.findUnique({ where: { email } });
	if (emailTaken) throw new ApiError(409, "EMAIL_TAKEN", "Email is already taken.");

	const hashedPassword: string = await bcrypt.hash(password, 10);

	const userCreated: User = await prisma.user.create({
		data: {
			email,
			username,
			passwordHash: hashedPassword,
		},
	});

	const newUser: UserResponse = {
		id: userCreated.id,
		username: userCreated.username,
		email: userCreated.email
	};

	return response.status(201).json(newUser);
});

authRouter.post('/login', async (request: Request, response: Response) => {
	const { username, password } = request.body;

	if (!username) throw new ApiError(400, "USERNAME_REQUIRED", "Username is required.");
	if (!password) throw new ApiError(400, "EMAIL_REQUIRED", "Email is required.");

	const user: User | null = await prisma.user.findUnique({ where: { username } });
	if (!user) throw new ApiError(401, "INVALID_CREDENTIALS", "Invalid username or password.");

	const passwordMatch: boolean = await bcrypt.compare(password, user.passwordHash);
	if (!passwordMatch) throw new ApiError(401, "INVALID_CREDENTIALS", "Invalid username or password.");

	const payload = { id: user.id, username: user.username };
	const token = jwt.sign(payload, SECRET, { expiresIn: '1h' });

	const loggedInUser: UserResponse = {
		id: user.id,
		username: user.username,
		email: user.email
	};

	const loginResponse: LoginResponse = { user: loggedInUser, token };

	return response.status(200).json(loginResponse);
});

authRouter.get('/me', tokenExtractor, userExtractor, async (request: Request, response: Response) => {
	const user: UserResponse = request.user;
	
	return response.json(user);
});

export default authRouter;