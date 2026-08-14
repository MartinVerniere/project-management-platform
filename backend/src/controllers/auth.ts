import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import type { Request, Response } from 'express';
import { Router } from 'express';
import { ApiError, tokenExtractor, userExtractor } from '../utils/middleware.js';
import { SECRET } from '../utils/config.js';
import { prisma } from '../prisma.js';
import type { LoginResponse } from '../models/user.js';
import multer from "multer";
import { supabase } from '../services/supabase.js';

const authRouter: Router = Router();

const upload = multer({ storage: multer.memoryStorage() });

authRouter.post('/register', upload.single('avatar'), async (request: Request, response: Response) => {
	const { username, email, password } = request.body;

	if (!username) throw new ApiError(400, "USERNAME_REQUIRED", "Username is required.");
	if (!email) throw new ApiError(400, "EMAIL_REQUIRED", "Email is required.");
	if (!password) throw new ApiError(400, "PASSWORD_REQUIRED", "Password is required.");
	if (password.length < 8) throw new ApiError(400, "PASSWORD_TOO_SHORT", "Password must be at least 8 characters long.");

	const usernameTaken = await prisma.user.findUnique({ where: { username } });
	if (usernameTaken) throw new ApiError(409, "USERNAME_TAKEN", "Username is already taken.");

	const emailTaken = await prisma.user.findUnique({ where: { email } });
	if (emailTaken) throw new ApiError(409, "EMAIL_TAKEN", "Email is already taken.");

	const hashedPassword: string = await bcrypt.hash(password, 10);

	const userCreated = await prisma.user.create({
		data: {
			email,
			username,
			passwordHash: hashedPassword,
		},
		select: {
			id: true,
			username: true,
			email: true,
		}
	});

	let avatarUrl: string | null = null;

	if (request.file) {
		const fileExtension = request.file.originalname.split('.').pop();
		const filePath = `${userCreated.id}.${fileExtension}`;

		const { error } = await supabase.storage
			.from('avatars')
			.upload(filePath, request.file.buffer, { contentType: request.file.mimetype, upsert: true });

		if (error) {
			await prisma.user.delete({ where: { id: userCreated.id } });
			throw new ApiError(500, "STORE_IMAGE_ERROR", "Failed storing avatar.");
		}

		const { data } = supabase.storage
			.from('avatars')
			.getPublicUrl(filePath);

		avatarUrl = data.publicUrl;

		await prisma.user.update({
			where: { id: userCreated.id },
			data: { avatarUrl }
		});
	}

	return response.status(201).json({ ...userCreated, avatarUrl });
});

authRouter.post('/login', async (request: Request, response: Response) => {
	const { username, password } = request.body;

	if (!username) throw new ApiError(400, "USERNAME_REQUIRED", "Username is required.");
	if (!password) throw new ApiError(400, "EMAIL_REQUIRED", "Email is required.");

	const user = await prisma.user.findUnique({ where: { username } });
	if (!user) throw new ApiError(401, "INVALID_CREDENTIALS", "Invalid username or password.");

	const passwordMatch: boolean = await bcrypt.compare(password, user.passwordHash);
	if (!passwordMatch) throw new ApiError(401, "INVALID_CREDENTIALS", "Invalid username or password.");

	const payload = { id: user.id, username: user.username };
	const token = jwt.sign(payload, SECRET, { expiresIn: '1h' });

	const loginResponse: LoginResponse = {
		user: {
			id: user.id,
			username: user.username,
			email: user.email,
			avatarUrl: user.avatarUrl,
		},
		token
	};

	return response.status(200).json(loginResponse);
});

authRouter.get('/me', tokenExtractor, userExtractor, async (request: Request, response: Response) => {
	const user = request.user;

	return response.json(user);
});

export default authRouter;