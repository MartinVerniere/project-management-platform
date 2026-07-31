import type { Board, BoardColumn, Comment, Project, ProjectMember, Task, User } from '../generated/prisma/client.ts';
import type { TokenPayload } from '../utils/middleware.ts';

declare global {
	namespace Express {
		interface Request {
			user: User;
			decodedToken: TokenPayload;
			project?: Project & {
				members: ProjectMember[];
			};
			projectMember?: ProjectMember;
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