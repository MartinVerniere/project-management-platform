import type { Board, BoardColumn, Comment, Project, ProjectMember, Task, User } from '../generated/prisma/client.ts';
import type { ColumnWithBoardResponse } from '../models/column.ts';
import type { TaskWithColumnAndAssigneeResponse } from '../models/task.ts';
import type { CommentWithTaskAndAuthorResponse } from '../models/comment.ts';
import type { TokenPayload } from '../utils/middleware.ts';
import type { UserDto } from '@shared/models/user.ts';
import type { ProjectMemberDto, ProjectDetailsDto } from '@shared/models/project.ts';
import type { BoardDetailsDto } from '@shared/models/board.ts';

declare global {
	namespace Express {
		interface Request {
			user: UserDto;
			decodedToken: TokenPayload;
			project?: ProjectDetailsDto;
			projectMember?: ProjectMemberDto;
			board?: BoardDetailsDto;
			boardColumn?: ColumnWithBoardResponse;
			task?: TaskWithColumnAndAssigneeResponse;
			comment?: CommentWithTaskAndAuthorResponse;
		}
	}
}

export { };