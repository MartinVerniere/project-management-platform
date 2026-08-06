import { UserResponse } from "./user";
import { CommentResponse } from "./comment";
 
export interface TaskResponse {
	id: number,
	title: string,
	description?: string,
	assignee?: UserResponse,
	comments: CommentResponse[]
}

export interface UpdateTaskRequest {
	title: string;
	description: string;
}

export type UpdateTaskResposne = TaskResponse;
export type MoveTaskResponse = TaskResponse;
export type AssignTaskResponse = TaskResponse;
export type UnnassignTaskResponse = TaskResponse;