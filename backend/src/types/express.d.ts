import type { Board, BoardColumn, Comment, Project, ProjectMember, Task, User } from '../generated/prisma/client.ts';
import type { ProjectResponse, ProjectMemberResponse } from '../models/project.ts';
import type { TokenPayload } from '../utils/middleware.ts';

declare global {
	namespace Express {
		interface Request {
			user: UserResponse;
			decodedToken: TokenPayload;
			project?: ProjectResponse;
			projectMember?: ProjectMemberResponse;
			board?: Board;
			boardColumn?: BoardColumn & {
				board: Board;
			};
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