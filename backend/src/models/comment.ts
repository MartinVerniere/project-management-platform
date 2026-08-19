import type { UserDto } from "../../../shared/models/user.js";
import type { TaskWithColumnAndAssigneeResponse } from "./task.js";

export interface CommentWithTaskAndAuthorResponse {
	id: number;
	content: string;
	task: TaskWithColumnAndAssigneeResponse;
	author: UserDto;
}