import { UserResponse } from "./user";
import type { Comment } from "../services/comments/comment-service";
 
export interface TaskResponse {
	id: number,
	title: string,
	description?: string,
	assignee?: UserResponse,
	comments: Comment[]
}

export interface UpdateTaskRequest {
	title: string;
	description: string;
}

export type UpdateTaskResposne = TaskResponse;
export type MoveTaskResponse = TaskResponse;
export type AssignTaskResponse = TaskResponse;
export type UnnassignTaskResponse = TaskResponse;