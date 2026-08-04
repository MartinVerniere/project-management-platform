import type { TaskWithColumnAndAssigneeResponse } from "./task.js";

export interface CommentResponse {
	id: number;
	content: string;
	taskId: number;
	userId: number;
}

export interface CommentWithTaskResponse {
	id: number;
	content: string;
	task: TaskWithColumnAndAssigneeResponse;
	userId: number;
}