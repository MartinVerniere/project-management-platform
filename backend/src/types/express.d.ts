import type { Board, BoardColumn, Comment, Project, ProjectMember, Task, User } from '../generated/prisma/client.ts';
import type { ProjectResponse, ProjectMemberResponse } from '../models/project.ts';
import type { UserResponse } from '../models/user.ts';
import type { BoardResponse } from '../models/board.ts';
import type { ColumnResponse, ColumnWithBoardResponse } from '../models/column.ts';
import type { TokenPayload } from '../utils/middleware.ts';

declare global {
	namespace Express {
		interface Request {
			user: UserResponse;
			decodedToken: TokenPayload;
			project?: ProjectResponse;
			projectMember?: ProjectMemberResponse;
			board?: BoardResponse;
			boardColumn?: ColumnWithBoardResponse;
			task?: Task & {
				column: BoardColumn & {
					board: Board;
				};
			};
			comment?: Comment & {
				task: Task & {
					column: BoardColumn & {
						board: Board;
					};
				};
			};
		}
	}
}

export { };