import { Router, type Request, type Response } from "express";
import { ApiError, requireTaskMember, taskExtractor, tokenExtractor, userExtractor } from "../utils/middleware.js";
import { prisma } from "../prisma.js";

const taskRouter = Router();

taskRouter.get('/:id',
	tokenExtractor,
	userExtractor,
	taskExtractor,
	requireTaskMember,
	async (request: Request, response: Response) => {
		const task = request.task!;

		return response.status(200).json(task);
	}
);

taskRouter.put('/:id',
	tokenExtractor,
	userExtractor,
	taskExtractor,
	requireTaskMember,
	async (request: Request, response: Response) => {
		const task = request.task!;
		const { title, description } = request.body;

		if (!title) throw new ApiError(400, "TASK_TITLE_REQUIRED", "Task title is required.");
		if (typeof title !== "string") throw new ApiError(400, "TASK_TITLE_INVALID", "Task title must be a string.");
		if (title.trim() === "") throw new ApiError(400, "TASK_TITLE_REQUIRED", "Task title is required.");

		const taskExists = await prisma.task.findUnique({
			where: { columnId_title: { columnId: task.columnId, title } }
		});
		if (taskExists) throw new ApiError(409, "TASK_EXISTS", "A task with this title already exists in the column.");

		const updatedTask = await prisma.task.update({ where: { id: task.id }, data: { title, description } });

		return response.status(200).json(updatedTask);
	}
);

taskRouter.post('/:id/comments',
	tokenExtractor,
	userExtractor,
	taskExtractor,
	requireTaskMember,
	async (request: Request, response: Response) => {
		const user = request.user!;
		const task = request.task!;
		const { content } = request.body;

		if (!content) throw new ApiError(400, "COMMENT_REQUIRED", "Comment is required.");
		if (typeof content !== "string") throw new ApiError(400, "COMMENT_INVALID", "Comment must be a string.");
		if (content.trim() === "") throw new ApiError(400, "COMMENT_REQUIRED", "Comment is required.");

		const newComment = await prisma.comment.create({
			data: {
				content: content.trim(),
				taskId: task.id,
				userId: user.id
			}
		});

		return response.status(201).json(newComment);
	}
);

taskRouter.delete('/:id',
	tokenExtractor,
	userExtractor,
	taskExtractor,
	requireTaskMember,
	async (request: Request, response: Response) => {
		const task = request.task!;

		await prisma.task.delete({ where: { id: task.id } });

		// Reset order values
		const remainingTasks = await prisma.task.findMany({
			where: { columnId: task.columnId },
			orderBy: { order: "asc" },
		});

		await prisma.$transaction([
			...remainingTasks.map((task, index) =>
				prisma.task.update({
					where: { id: task.id },
					data: { order: -(index + 1) },
				})
			),

			...remainingTasks.map((task, index) =>
				prisma.task.update({
					where: { id: task.id },
					data: { order: index },
				})
			),
		]);

		return response.status(204).send();
	}
);

export default taskRouter;