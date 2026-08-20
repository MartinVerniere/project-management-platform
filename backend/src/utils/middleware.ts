import jwt from 'jsonwebtoken';
import type { Request, Response, NextFunction } from 'express';
import { SECRET } from './config.js';
import { prisma } from '../prisma.js';
import { ProjectRole } from '../generated/prisma/client.js';

export interface TokenPayload {
	id: number;
	username: string;
}

export class ApiError extends Error {
	constructor(public status: number, public code: string, message: string) {
		super(message);
	}
}

// General middleware

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

// Auth middleware

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

	const user = await prisma.user.findUnique({
		where: { id: userId },
		select: {
			id: true,
			username: true,
			email: true,
			avatarUrl: true,
		}
	});
	if (!user) throw new ApiError(404, "USER_NOT_FOUND", "User not found.");

	request.user = user;

	next();
}

// Project middleware

export const projectExtractor = async (
	request: Request,
	_response: Response,
	next: NextFunction
): Promise<void> => {
	const projectId = Number(request.params.id);
	if (!Number.isInteger(projectId)) throw new ApiError(400, "INVALID_PROJECT_ID", "Invalid project id.");

	const project = await prisma.project.findUnique({
		where: { id: projectId },
		select: {
			id: true,
			key: true,
			name: true,
			description: true,
			boards: {
				select: {
					id: true,
					name: true,
					projectId: true
				}
			},
			members: {
				select: {
					id: true,
					role: true,
					user: {
						select: {
							id: true,
							username: true,
							email: true,
							avatarUrl: true,
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
	const userId = Number(request.user.id);
	const project = request.project!;

	const membership = await prisma.projectMember.findUnique({
		where: { projectId_userId: { projectId: project.id, userId: userId } },
		include: { user: true }
	});
	if (!membership) throw new ApiError(403, "PROJECT_ACCESS_DENIED", "You do not have access to this project.");

	request.projectMember = membership;

	next();
}

export const requireProjectAdmin = async (
	request: Request,
	_response: Response,
	next: NextFunction
): Promise<void> => {
	const projectMember = request.projectMember!;
	if (projectMember.role !== ProjectRole.ADMIN) throw new ApiError(403, "INSUFFICIENT_PERMISSIONS", "You must be a project admin to perform this action.");

	next();
};

// Board middleware

export const boardExtractor = async (
	request: Request,
	_response: Response,
	next: NextFunction
): Promise<void> => {
	const boardId = Number(request.params.id);
	if (!Number.isInteger(boardId)) throw new ApiError(400, "INVALID_BOARD_ID", "Invalid board id.");

	const board = await prisma.board.findUnique({
		where: { id: boardId },
		select: {
			id: true,
			name: true,
			projectId: true,
			columns: {
				orderBy: { order: "asc" },
				select: {
					id: true,
					name: true,
					boardId: true,
					order: true,
					tasks: {
						orderBy: { order: "asc" },
						select: {
							id: true,
							title: true,
							description: true,
							columnId: true,
							order: true,
							assignee: {
								select: {
									id: true,
									username: true,
									email: true,
									avatarUrl: true,
								}
							},
							comments: {
								orderBy: { createdAt: "asc" },
								select: {
									id: true,
									content: true,
									taskId: true,
									author: {
										select: {
											id: true,
											username: true,
											email: true,
											avatarUrl: true,
										}
									}
								}
							}
						}
					}
				}
			}
		}
	});
	if (!board) throw new ApiError(404, "BOARD_NOT_FOUND", "Board not found.");

	request.board = board;

	next();
};

export const requireBoardMember = async (
	request: Request,
	_response: Response,
	next: NextFunction
): Promise<void> => {
	const userId = Number(request.user.id);
	const board = request.board!;

	const membership = await prisma.projectMember.findUnique({
		where: {
			projectId_userId: {
				projectId: board.projectId,
				userId: userId,
			}
		},
		include: { user: true }
	});
	if (!membership) throw new ApiError(403, "PROJECT_ACCESS_DENIED", "You do not have access to this project.");

	request.projectMember = membership;

	next();
}

export const requireBoardAdmin = async (
	request: Request,
	_response: Response,
	next: NextFunction
): Promise<void> => {
	const projectMember = request.projectMember!;
	if (projectMember.role !== ProjectRole.ADMIN) throw new ApiError(403, "INSUFFICIENT_PERMISSIONS", "You must be a project admin to perform this action.");

	next();
};

// Column middleware

export const columnExtractor = async (
	request: Request,
	_response: Response,
	next: NextFunction
): Promise<void> => {
	const columnId = Number(request.params.id);
	if (!Number.isInteger(columnId)) throw new ApiError(400, "INVALID_BOARD_COLUMN_ID", "Invalid column id.");

	const boardColumn = await prisma.boardColumn.findUnique({
		where: { id: columnId },
		include: { board: true },
	});
	if (!boardColumn) throw new ApiError(404, "BOARD_COLUMN_NOT_FOUND", "Column not found.");

	request.boardColumn = boardColumn;

	next();
};

export const requireColumnMember = async (
	request: Request,
	_response: Response,
	next: NextFunction
): Promise<void> => {
	const userId = Number(request.user.id);
	const boardColumn = request.boardColumn!;

	const membership = await prisma.projectMember.findUnique({
		where: {
			projectId_userId: {
				projectId: boardColumn.board.projectId,
				userId: userId,
			}
		},
		include: { user: true }
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

// Task middleware

export const taskExtractor = async (
	request: Request,
	_response: Response,
	next: NextFunction
): Promise<void> => {
	const taskId = Number(request.params.id);
	if (!Number.isInteger(taskId)) throw new ApiError(400, "INVALID_TASK_ID", "Invalid task id.");

	const task = await prisma.task.findUnique({
		where: { id: taskId },
		include: {
			column: {
				include: { board: true },
			},
			assignee: true
		},
	});
	if (!task) throw new ApiError(404, "TASK_NOT_FOUND", "Task not found.");

	request.task = task;

	next();
};

export const requireTaskMember = async (
	request: Request,
	_response: Response,
	next: NextFunction
): Promise<void> => {
	const userId = Number(request.user.id);
	const task = request.task!

	const membership = await prisma.projectMember.findUnique({
		where: {
			projectId_userId: {
				projectId: task.column.board.projectId,
				userId: userId,
			}
		},
		include: { user: true }
	});
	if (!membership) throw new ApiError(403, "PROJECT_ACCESS_DENIED", "You do not have access to this project.");

	request.projectMember = membership;

	next();
}

export const requireTaskAdmin = async (
	request: Request,
	_response: Response,
	next: NextFunction
): Promise<void> => {
	const projectMember = request.projectMember!;
	if (projectMember.role !== ProjectRole.ADMIN) throw new ApiError(403, "INSUFFICIENT_PERMISSIONS", "You must be a project admin to perform this action.");

	next();
}

// Comment middleware

export const commentExtractor = async (
	request: Request,
	_response: Response,
	next: NextFunction
): Promise<void> => {
	const commentId = Number(request.params.id);
	if (!Number.isInteger(commentId)) throw new ApiError(400, "INVALID_COMMENT_ID", "Invalid comment id.");

	const comment = await prisma.comment.findUnique({
		where: { id: commentId },
		include: {
			task: {
				include: {
					column: {
						include: { board: true },
					},
					assignee: {
						select: {
							id: true,
							username: true,
							email: true,
							avatarUrl: true,
						}
					},
				},
			},
			author: {
				select: {
					id: true,
					username: true,
					email: true,
					avatarUrl: true,
				}
			}
		},
	});
	if (!comment) throw new ApiError(404, "COMMENT_NOT_FOUND", "Comment not found.");

	request.comment = comment;

	next();
};

export const requireCommentEditor = async (
	request: Request,
	_response: Response,
	next: NextFunction
): Promise<void> => {
	const userId = request.user.id;
	const comment = request.comment!;

	const isCommentAuthor = comment.author.id === userId;

	const membership = await prisma.projectMember.findUnique({
		where: {
			projectId_userId: {
				projectId: comment.task.column.board.projectId,
				userId,
			},
		},
		include: { user: true }
	});

	const isCommentAdmin = membership?.role === ProjectRole.ADMIN;

	if (!isCommentAuthor && !isCommentAdmin) throw new ApiError(403, "COMMENT_ACCESS_DENIED", "You do not have permission to edit this comment.");

	next();
}