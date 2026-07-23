import jwt from 'jsonwebtoken';
import type { Request, Response, NextFunction } from 'express';
import { SECRET } from './config.js';
import { prisma } from '../prisma.js';
import { ProjectRole, type User } from '../generated/prisma/client.js';

interface TokenPayload {
	id: number;
	username: string;
}

export class ApiError extends Error {
	constructor(public status: number, public code: string, message: string) {
		super(message);
	}
}

export const errorHandler = (
	error: unknown,
	_request: Request,
	response: Response,
	_next: NextFunction
) => {
	console.error(error);

	if (error instanceof ApiError) {
		return response.status(error.status).json({
			error: {
				code: error.code,
				message: error.message
			}
		});
	}

	return response.status(500).json({
		error: {
			code: "INTERNAL_SERVER_ERROR",
			message: "An unexpected error occurred."
		}
	});
};

export const loggerMiddleware = (
	request: Request,
	response: Response,
	next: NextFunction
): void => {
	const startedAt = new Date();

	console.log(`[${startedAt.toISOString()}] Started ${request.method} ${request.originalUrl}`);

	response.on("finish", () => {
		const endedAt = new Date();
		const duration: number = endedAt.getTime() - startedAt.getTime();

		console.log(`[${endedAt.toISOString()}] Finished ${request.method} ${request.originalUrl} ${response.statusCode} (${duration}ms)`);
	});

	next();
};

export const tokenExtractor = (
	request: Request,
	_response: Response,
	next: NextFunction
): void => {
	const authorization: string | undefined = request.get('authorization');
	if (!authorization || !authorization.toLowerCase().startsWith('bearer ')) throw new ApiError(401, "TOKEN_MISSING", "Authentication token is missing.");

	try {
		request.decodedToken = jwt.verify(authorization.substring(7), SECRET) as TokenPayload;
	} catch {
		throw new ApiError(401, "TOKEN_INVALID", "Authentication token is invalid.");
	}

	next();
}

export const userExtractor = async (
	request: Request,
	_response: Response,
	next: NextFunction
): Promise<void> => {
	const userId: number = request.decodedToken.id;

	const user: User | null = await prisma.user.findUnique({ where: { id: userId } });
	if (!user) throw new ApiError(404, "USER_NOT_FOUND", "User not found.");

	request.user = user;

	next();
}

export const projectExtractor = async (
	request: Request,
	_response: Response,
	next: NextFunction
): Promise<void> => {
	const requestProjectId = Number(request.params.id);
	if (!Number.isInteger(requestProjectId)) throw new ApiError(400, "INVALID_PROJECT_ID", "Invalid project id.");

	const project = await prisma.project.findUnique({
		where: { id: requestProjectId },
		include: {
			members: {
				include: {
					user: {
						select: {
							id: true,
							username: true,
							email: true
						}
					}
				}
			}
		}
	});
	if (!project) throw new ApiError(404, "PROJECT_NOT_FOUND", "Project not found.");

	request.project = project;

	next();
};

export const requireProjectMember = async (
	request: Request,
	_response: Response,
	next: NextFunction
): Promise<void> => {
	const userId = request.user.id;
	const project = request.project!;

	const membership = project.members.find(member => member.userId === userId);
	if (!membership) throw new ApiError(403, "PROJECT_ACCESS_DENIED", "You do not have access to this project.");

	request.projectMember = membership;

	next();
}

export const requireProjectAdminRole = async (
	request: Request,
	_response: Response,
	next: NextFunction
): Promise<void> => {
	const projectMember = request.projectMember!;
	if (projectMember.role !== ProjectRole.ADMIN) throw new ApiError(403, "INSUFFICIENT_PERMISSIONS", "You must be a project admin to perform this action.");

	next();
};

export const boardExtractor = async (
	request: Request,
	_response: Response,
	next: NextFunction
): Promise<void> => {
	const requestBoardId = Number(request.params.id);
	if (!Number.isInteger(requestBoardId)) throw new ApiError(400, "INVALID_BOARD_ID", "Invalid board id.");

	const board = await prisma.board.findUnique({
		where: { id: requestBoardId },
		include: {
			columns: {
				orderBy: { order: "asc" },
				include: {
					tasks: {
						orderBy: { order: "asc" }
					}
				}
			}
		}
	});
	if (!board) throw new ApiError(404, "BOARD_NOT_FOUND", "Board not found.");

	request.board = board;

	next();
};

export const requireBoardProjectMember = async (
	request: Request,
	_response: Response,
	next: NextFunction
): Promise<void> => {
	const userId = request.user.id;
	const board = request.board!;

	const membership = await prisma.projectMember.findFirst({
		where: {
			projectId: board.projectId,
			userId: userId,
		},
	});
	if (!membership) throw new ApiError(403, "PROJECT_ACCESS_DENIED", "You do not have access to this project.");

	request.projectMember = membership;

	next();
}

export const requireBoardProjectAdminRole = async (
	request: Request,
	_response: Response,
	next: NextFunction
): Promise<void> => {
	const projectMember = request.projectMember!;
	if (projectMember.role !== ProjectRole.ADMIN) throw new ApiError(403, "INSUFFICIENT_PERMISSIONS", "You must be a project admin to perform this action.");

	next();
};

export const columnExtractor = async (
	request: Request,
	_response: Response,
	next: NextFunction
): Promise<void> => {
	const requestBoardColumnId = Number(request.params.id);
	if (!Number.isInteger(requestBoardColumnId)) throw new ApiError(400, "INVALID_BOARD_COLUMN_ID", "Invalid column id.");

	const boardColumn = await prisma.boardColumn.findUnique({ where: { id: requestBoardColumnId } });
	if (!boardColumn) throw new ApiError(404, "BOARD_COLUMN_NOT_FOUND", "Column not found.");

	request.boardColumn = boardColumn;

	next();
};

export const requireColumnMember = async (
	request: Request,
	_response: Response,
	next: NextFunction
): Promise<void> => {
	const userId = request.user.id;
	const boardColumn = request.boardColumn!;

	const board = await prisma.board.findUnique({ where: { id: boardColumn.boardId } });
	if (!board) throw new ApiError(404, "BOARD_NOT_FOUND", "Board not found.");

	const membership = await prisma.projectMember.findFirst({
		where: {
			projectId: board.projectId,
			userId: userId,
		},
	});
	if (!membership) throw new ApiError(403, "PROJECT_ACCESS_DENIED", "You do not have access to this project.");

	request.projectMember = membership;

	next();
}

export const requireColumnAdmin = async (
	request: Request,
	_response: Response,
	next: NextFunction
): Promise<void> => {
	const projectMember = request.projectMember!;
	if (projectMember.role !== ProjectRole.ADMIN) throw new ApiError(403, "INSUFFICIENT_PERMISSIONS", "You must be a project admin to perform this action.");

	next();
};

export const taskExtractor = async (
	request: Request,
	_response: Response,
	next: NextFunction
): Promise<void> => {
	const requestTaskId = Number(request.params.id);
	if (!Number.isInteger(requestTaskId)) throw new ApiError(400, "INVALID_TASK_ID", "Invalid task id.");

	const task = await prisma.task.findUnique({ where: { id: requestTaskId } });
	if (!task) throw new ApiError(404, "TASK_NOT_FOUND", "Task not found.");

	request.task = task;

	next();
};

export const requireTaskMember = async (
	request: Request,
	_response: Response,
	next: NextFunction
): Promise<void> => {
	const userId = request.user.id;
	const task = request.task!;

	const column = await prisma.boardColumn.findUnique({ where: { id: task.columnId } });
	if (!column) throw new ApiError(404, "COLUMN_NOT_FOUND", "Column not found.");
	const board = await prisma.board.findUnique({ where: { id: column.boardId } });
	if (!board) throw new ApiError(404, "BOARD_NOT_FOUND", "Board not found.");

	const membership = await prisma.projectMember.findFirst({
		where: {
			projectId: board.projectId,
			userId: userId,
		},
	});
	if (!membership) throw new ApiError(403, "PROJECT_ACCESS_DENIED", "You do not have access to this project.");

	request.projectMember = membership;

	next();
}