import type { ColumnWithBoardResponse } from "./column.js";
import type { UserResponse } from "./user.js";

export interface TaskResponse {
	id: number;
	title: string;
	description: string | null;
	columnId: number;
	order: number;
	assigneeId: number | null;
}

export interface TaskWithColumnAndAssigneeResponse {
	id: number;
	title: string;
	description: string | null;
	column: ColumnWithBoardResponse;
	order: number;
	assignee: UserResponse | null;
}