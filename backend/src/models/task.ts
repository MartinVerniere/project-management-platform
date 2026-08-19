import type { UserDto } from "../../../shared/models/user.js";
import type { ColumnWithBoardResponse } from "./column.js";

export interface TaskWithColumnAndAssigneeResponse {
	id: number;
	title: string;
	description: string | null;
	column: ColumnWithBoardResponse;
	order: number;
	assignee: UserDto | null;
}