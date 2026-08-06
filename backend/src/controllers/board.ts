import { Router, type Request, type Response } from "express";
import { ApiError, boardExtractor, requireBoardAdmin, requireBoardMember, tokenExtractor, userExtractor } from "../utils/middleware.js";
import { prisma } from "../prisma.js";

const boardRouter = Router();

boardRouter.get("/:id",
	tokenExtractor,
	userExtractor,
	boardExtractor,
	requireBoardMember,
	async (request: Request, response: Response) => {
		const board = request.board!;

		return response.status(200).json(board);
	}
);

boardRouter.put("/:id",
	tokenExtractor,
	userExtractor,
	boardExtractor,
	requireBoardMember,
	requireBoardAdmin,
	async (request: Request, response: Response) => {
		const board = request.board!;
		const { name } = request.body;

		if (!name) throw new ApiError(400, "BOARD_NAME_REQUIRED", "Board name is required.");
		if (typeof name !== "string") throw new ApiError(400, "BOARD_NAME_INVALID", "Board name must be a string.");
		if (name.trim() === "") throw new ApiError(400, "BOARD_NAME_REQUIRED", "Board name is required.");

		const boardExists = await prisma.board.findUnique({
			where: { projectId_name: { projectId: board.projectId, name } }
		});
		if (boardExists) throw new ApiError(409, "BOARD_EXISTS", "A board with this name already exists in the project.");

		const updatedBoard = await prisma.board.update({
			where: { id: board.id },
			data: { name },
			select: {
				id: true,
				name: true,
				projectId: true,
			},
		});

		return response.status(200).json(updatedBoard);
	}
);

boardRouter.post("/:id/columns",
	tokenExtractor,
	userExtractor,
	boardExtractor,
	requireBoardMember,
	requireBoardAdmin,
	async (request: Request, response: Response) => {
		const board = request.board!;
		const { name } = request.body;

		if (!name) throw new ApiError(400, "BOARD_COLUMN_NAME_REQUIRED", "Column name is required.");
		if (typeof name !== "string") throw new ApiError(400, "BOARD_COLUMN_NAME_INVALID", "Column name must be a string.");
		if (name.trim() === "") throw new ApiError(400, "BOARD_COLUMN_NAME_REQUIRED", "Column name is required.");

		const columnExists = await prisma.boardColumn.findUnique({
			where: { boardId_name: { boardId: board.id, name } }
		});
		if (columnExists) throw new ApiError(409, "BOARD_COLUMN_EXISTS", "A column with this name already exists in the board.");

		const allBoardColumns = await prisma.boardColumn.findMany({ where: { boardId: board.id } })!;
		const order = allBoardColumns.length; // Place it at end of board column list

		const newColumn = await prisma.boardColumn.create({
			data: { name, boardId: board.id, order: order },
			select: {
				id: true,
				name: true,
				boardId: true,
				order: true
			}
		});

		return response.status(201).json(newColumn);
	}
);

boardRouter.put("/:id/columns/order",
	tokenExtractor,
	userExtractor,
	boardExtractor,
	requireBoardMember,
	requireBoardAdmin,
	async (request: Request, response: Response) => {
		const board = request.board!;
		const { columnOrder } = request.body;

		if (!columnOrder) throw new ApiError(400, "COLUMN_ORDER_REQUIRED", "Column order is required.");
		if (!Array.isArray(columnOrder)) throw new ApiError(400, "INVALID_COLUMN_ORDER", "Column order must be an array.");

		const boardColumns = await prisma.boardColumn.findMany({ where: { boardId: board.id } });
		const boardColumnIds = new Set(boardColumns.map(column => column.id));

		if (columnOrder.length !== boardColumns.length) throw new ApiError(400, "INVALID_COLUMN_ORDER", "Every board column must be included.");

		for (const column of columnOrder) {
			if (!Number.isInteger(column.id)) throw new ApiError(400, "INVALID_COLUMN_ID", "Invalid column id.");
			if (!Number.isInteger(column.order)) throw new ApiError(400, "INVALID_COLUMN_ORDER", "Invalid column order.");
			if (!boardColumnIds.has(column.id)) throw new ApiError(400, "INVALID_COLUMN", "Column does not belong to this board.");
		}

		await prisma.$transaction([
			// Need to do this step because if not then prisma throws error "Unique constraint failed on the fields: (`"boardId"`, `"order"`)""
			// So I first order columns with negative values, and then order them correctly with values in request
			...columnOrder.map(column =>
				prisma.boardColumn.update({
					where: { id: column.id },
					data: {
						order: -(column.order + 1),
					},
				})
			),

			...columnOrder.map(column =>
				prisma.boardColumn.update({
					where: { id: column.id },
					data: {
						order: column.order,
					},
				})
			),
		]);

		const updatedBoard = await prisma.board.findUnique({
			where: { id: board.id },
			select: {
				id: true,
				name: true,
				projectId: true,
				columns: {
					orderBy: { order: "asc" }
				},
			},
		});

		return response.status(200).json(updatedBoard);
	}
);

boardRouter.delete("/:id",
	tokenExtractor,
	userExtractor,
	boardExtractor,
	requireBoardMember,
	requireBoardAdmin,
	async (request: Request, response: Response) => {
		const board = request.board!;

		await prisma.board.delete({ where: { id: board.id } });

		return response.status(204).send();
	}
);


export default boardRouter;