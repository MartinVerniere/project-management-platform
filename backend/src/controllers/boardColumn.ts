import { Router, type Request, type Response } from "express";
import { tokenExtractor, userExtractor, columnExtractor, requireColumnMember, ApiError, requireColumnAdmin } from "../utils/middleware.js";
import { prisma } from "../prisma.js";
import type { ColumnDto } from "../../../shared/models/column.js";

const boardColumnRouter = Router();

boardColumnRouter.get('/:id',
	tokenExtractor,
	userExtractor,
	columnExtractor,
	requireColumnMember,
	async (request: Request, response: Response) => {
		const boardColumn = request.boardColumn!;

		const columnResponse: ColumnDto = {
			id: boardColumn.id,
			name: boardColumn.name,
			boardId: boardColumn.board.id,
			order: boardColumn.order
		};

		return response.status(200).json(columnResponse);
	}
);

boardColumnRouter.put('/:id',
	tokenExtractor,
	userExtractor,
	columnExtractor,
	requireColumnMember,
	requireColumnAdmin,
	async (request: Request, response: Response) => {
		const boardColumn = request.boardColumn!;
		const { name } = request.body;

		if (!name) throw new ApiError(400, "BOARD_COLUMN_NAME_REQUIRED", "Column name is required.");
		if (typeof name !== "string") throw new ApiError(400, "BOARD_COLUMN_NAME_INVALID", "Column name must be a string.");
		if (name.trim() === "") throw new ApiError(400, "BOARD_COLUMN_NAME_REQUIRED", "Column name is required.");

		const boardColumnExists = await prisma.boardColumn.findUnique({
			where: { boardId_name: { boardId: boardColumn.board.id, name } }
		});
		if (boardColumnExists) throw new ApiError(409, "BOARD_COLUMN_EXISTS", "A column with this name already exists in the board.");

		const updatedBoardColumn = await prisma.boardColumn.update({
			where: { id: boardColumn.id },
			data: { name },
			select: {
				id: true,
				name: true,
				boardId: true,
				order: true,
			}
		});

		return response.status(200).json(updatedBoardColumn);
	}
);

boardColumnRouter.post('/:id/tasks',
	tokenExtractor,
	userExtractor,
	columnExtractor,
	requireColumnMember,
	async (request: Request, response: Response) => {
		const column = request.boardColumn!;
		const { title, description } = request.body;

		if (!title) throw new ApiError(400, "TASK_TITLE_REQUIRED", "Task title is required.");
		if (typeof title !== "string") throw new ApiError(400, "TASK_TITLE_INVALID", "Task title must be a string.");
		if (title.trim() === "") throw new ApiError(400, "TASK_TITLE_REQUIRED", "Task title is required.");

		const taskExists = await prisma.task.findUnique({ where: { columnId_title: { columnId: column.id, title } } })
		if (taskExists) throw new ApiError(409, "TASK_EXISTS", "A task with this title already exists in the column.");

		const allTasks = await prisma.task.findMany({ where: { columnId: column.id } });
		const order = allTasks.length;

		const createdTask = await prisma.task.create({
			data: { title, description, columnId: column.id, order: order },
			select: {
				id: true,
				title: true,
				description: true,
				columnId: true,
				order: true,
			}
		});

		return response.status(201).json(createdTask);
	}
);

boardColumnRouter.put('/:id/tasks/order',
	tokenExtractor,
	userExtractor,
	columnExtractor,
	requireColumnMember,
	async (request: Request, response: Response) => {
		const column = request.boardColumn!;
		const { taskOrder } = request.body;

		if (!taskOrder) throw new ApiError(400, "TASK_ORDER_REQUIRED", "Task order is required.");
		if (!Array.isArray(taskOrder)) throw new ApiError(400, "INVALID_TASK_ORDER", "Task order must be an array.");

		const tasks = await prisma.task.findMany({ where: { columnId: column.id } });
		const tasksIds = new Set(tasks.map(task => task.id));

		if (taskOrder.length !== tasks.length) throw new ApiError(400, "INVALID_TASK_ORDER", "Every task must be included.")

		for (const task of taskOrder) {
			if (!Number.isInteger(task.id)) throw new ApiError(400, "INVALID_TASK_ID", "Invalid task id.");
			if (!Number.isInteger(task.order)) throw new ApiError(400, "INVALID_TASK_ORDER", "Invalid task order.");
			if (!tasksIds.has(task.id)) throw new ApiError(400, "INVALID_TASK", "Task does not belong to this column.");
		};

		await prisma.$transaction([
			...taskOrder.map(task =>
				prisma.task.update({
					where: { id: task.id },
					data: {
						order: -(task.order + 1),
					},
				})
			),

			...taskOrder.map(task =>
				prisma.task.update({
					where: { id: task.id },
					data: {
						order: task.order,
					},
				})
			),
		]);

		const updatedBoardColumn = await prisma.boardColumn.findUnique({
			where: { id: column.id },
			select: {
				id: true,
				name: true,
				boardId: true,
				order: true,
				tasks: {
					orderBy: { order: "asc" }
				},
			}
		});

		return response.status(200).json(updatedBoardColumn);
	}
);

boardColumnRouter.delete('/:id',
	tokenExtractor,
	userExtractor,
	columnExtractor,
	requireColumnMember,
	requireColumnAdmin,
	async (request: Request, response: Response) => {
		const boardColumn = request.boardColumn!;

		await prisma.boardColumn.delete({ where: { id: boardColumn.id } });

		// Reset order values
		const remainingColumns = await prisma.boardColumn.findMany({
			where: { boardId: boardColumn.board.id },
			orderBy: { order: "asc" },
		});

		await prisma.$transaction([
			// See board > change column order endpoint for why to do this
			...remainingColumns.map((column, index) =>
				prisma.boardColumn.update({
					where: { id: column.id },
					data: { order: -(index + 1) },
				})
			),

			...remainingColumns.map((column, index) =>
				prisma.boardColumn.update({
					where: { id: column.id },
					data: { order: index },
				})
			),
		]);

		return response.status(204).send();
	}
);

export default boardColumnRouter;