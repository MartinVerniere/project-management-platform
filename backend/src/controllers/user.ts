import { Router, type Request, type Response } from 'express';
import { ApiError, tokenExtractor, userExtractor } from '../utils/middleware.js';
import { prisma } from '../prisma.js';
import type { UserResponse } from '../models/user.js';

const userRouter = Router();

userRouter.get('/', tokenExtractor, userExtractor, async (request: Request, response: Response) => {
	const users: UserResponse[] = await prisma.user.findMany({
		select: {
			id: true,
			username: true,
			email: true
		}
	});

	return response.status(200).json(users);
});

userRouter.get('/:id', tokenExtractor, userExtractor, async (request: Request, response: Response) => {
	const userId = Number(request.params.id);

	if (!Number.isInteger(userId)) throw new ApiError(400, "INVALID_USER_ID", "Invalid user id.");

	const user: UserResponse | null = await prisma.user.findUnique({ 
		where: { id: userId },
		select: {
			id: true,
			email: true,
			username: true
		} 
	});

	if (!user) throw new ApiError(404, "USER_NOT_FOUND", "User not found.");

	return response.status(200).json(user);
})

export default userRouter;