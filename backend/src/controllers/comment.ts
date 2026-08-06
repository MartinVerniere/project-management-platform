import { Router, type Request, type Response } from "express";
import { ApiError, commentExtractor, requireCommentEditor, tokenExtractor, userExtractor } from "../utils/middleware.js";
import { prisma } from "../prisma.js";
import type { CommentResponse } from "../models/comment.js";

const commentRouter = Router();

commentRouter.get('/:id',
	tokenExtractor,
	userExtractor,
	commentExtractor,
	async (request: Request, response: Response) => {
		const comment = request.comment!;

		const responseComment: CommentResponse = {
			id: comment.id,
			content: comment.content,
			taskId: comment.task.id,
			userId: comment.userId
		}

		return response.status(200).json(responseComment);
	}
);

commentRouter.put('/:id',
	tokenExtractor,
	userExtractor,
	commentExtractor,
	requireCommentEditor,
	async (request: Request, response: Response) => {
		const comment = request.comment!;
		const { content } = request.body;

		if (!content) throw new ApiError(400, "COMMENT_REQUIRED", "Comment is required.");
		if (typeof content !== "string") throw new ApiError(400, "COMMENT_INVALID", "Comment must be a string.");
		if (content.trim() === "") throw new ApiError(400, "COMMENT_REQUIRED", "Comment is required.");

		const updatedComment = await prisma.comment.update({ 
			where: { id: comment.id }, 
			data: { content },
			select: {
				id: true,
				content: true,
				taskId: true,
				userId: true
			}
		});

		return response.status(200).json(updatedComment);
	}
);

commentRouter.delete('/:id',
	tokenExtractor,
	userExtractor,
	commentExtractor,
	requireCommentEditor,
	async (request: Request, response: Response) => {
		const comment = request.comment!;

		await prisma.comment.delete({ where: { id: comment.id } });

		return response.status(204).send();
	}
);

export default commentRouter;