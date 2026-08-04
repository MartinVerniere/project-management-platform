import { Router, type Request, type Response } from "express";
import { ApiError, requireTaskAdmin, requireTaskMember, taskExtractor, tokenExtractor, userExtractor } from "../utils/middleware.js";
import { prisma } from "../prisma.js";
import type { TaskResponse } from "../models/task.js";
import type { BoardColumn } from "../generated/prisma/client.js";
import type { UserResponse } from "../models/user.js";
import type { ProjectMemberResponse } from "../models/project.js";
import type { CommentResponse } from "../models/comment.js";

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

		const taskExists: TaskResponse | null = await prisma.task.findUnique({
			where: { columnId_title: { columnId: task.column.id, title } }
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

		const newComment: CommentResponse = await prisma.comment.create({
			data: {
				content: content.trim(),
				taskId: task.id,
				userId: user.id
			}
		});

		return response.status(201).json(newComment);
	}
);

taskRouter.put('/:id/column',
	tokenExtractor,
	userExtractor,
	taskExtractor,
	requireTaskMember,
	async (request: Request, response: Response) => {
		const task = request.task!;
		const { columnId } = request.body;

		const originColumn: BoardColumn | null = await prisma.boardColumn.findUnique({ where: { id: task.column.id } });
		if (!originColumn) throw new ApiError(404, "ORIGIN_COLUMN_NOT_FOUND", "Origin column not found.");

		if (!columnId) throw new ApiError(400, "COLUMN_ID_REQUIRED", "Column id is required.");
		if (!Number.isInteger(columnId)) throw new ApiError(400, "INVALID_COLUMN_ID", "Invalid column id.");

		// If already in column, just return
		if (task.column.id === columnId) return response.status(200).json(task);

		const destinationColumn = await prisma.boardColumn.findUnique({
			where: { id: columnId },
			include: {
				tasks: true
			}
		});
		if (!destinationColumn) throw new ApiError(404, "DESTINATION_COLUMN_NOT_FOUND", "Destination column not found.");
		if (originColumn.boardId !== destinationColumn.boardId) throw new ApiError(409, "INVALID_TASK_MOVE", "Can't move a task to a column of a different board.");

		const taskTitleExists: TaskResponse | null = await prisma.task.findUnique({
			where: {
				columnId_title: {
					columnId: destinationColumn.id,
					title: task.title,
				}
			}
		});

		if (taskTitleExists) throw new ApiError(409, "TASK_TITLE_ALREADY_EXISTS", "A task with this title already exists in the destination column.");

		const destinationTaskCount = destinationColumn.tasks.length;

		const updatedTask: TaskResponse = await prisma.$transaction(async (transaction) => {
			// Move task to destination column (append at the end)
			const updatedTask: TaskResponse = await transaction.task.update({
				where: { id: task.id },
				data: {
					columnId: destinationColumn.id,
					order: destinationTaskCount,
				},
			});

			// Reorder old column
			const remainingTasks: TaskResponse[] = await transaction.task.findMany({
				where: { columnId: originColumn.id },
				orderBy: { order: "asc" },
			});

			for (const [index, remainingTask] of remainingTasks.entries()) {
				await transaction.task.update({
					where: { id: remainingTask.id },
					data: { order: index },
				});
			}

			return updatedTask;
		});

		return response.status(200).json(updatedTask);
	}
);

taskRouter.put('/:id/assignee',
	tokenExtractor,
	userExtractor,
	taskExtractor,
	requireTaskMember,
	requireTaskAdmin,
	async (request: Request, response: Response) => {
		const task = request.task!;
		const { userId } = request.body;

		if (!userId) throw new ApiError(400, "USER_ID_REQUIRED", "User ID is required.");
		if (!Number.isInteger(userId)) throw new ApiError(400, "INVALID_USER_ID", "Invalid user id.");

		const userExists: UserResponse | null = await prisma.user.findUnique({ where: { id: userId } });
		if (!userExists) throw new ApiError(404, "USER_NOT_FOUND", "User to assign task not found.");

		const userIsMember: ProjectMemberResponse | null = await prisma.projectMember.findUnique({
			where: {
				projectId_userId: {
					projectId: task.column.board.projectId,
					userId: userId
				}
			},
			include: {
				user: true
			}
		});
		if (!userIsMember) throw new ApiError(409, "USER_NOT_MEMBER", "User can't be assigned to a task of a project he is not a member of.");

		const updatedTask: TaskResponse = await prisma.task.update({ where: { id: task.id }, data: { assigneeId: userId } });

		return response.status(200).json(updatedTask);
	}
);

taskRouter.delete('/:id/assignee',
	tokenExtractor,
	userExtractor,
	taskExtractor,
	requireTaskMember,
	requireTaskAdmin,
	async (request: Request, response: Response) => {
		const task = request.task!;

		const updatedTask: TaskResponse = await prisma.task.update({ where: { id: task.id }, data: { assigneeId: null } });

		return response.status(200).json(updatedTask);
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
		const remainingTasks: TaskResponse[] = await prisma.task.findMany({
			where: { columnId: task.column.id },
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