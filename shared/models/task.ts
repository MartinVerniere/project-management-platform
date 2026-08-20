import type { CommentDto } from "./comment.js";
import type { UserDto } from "./user.js";

export interface TaskDto {
	id: number,
	title: string,
	description: string | null,
	columnId: number
	order: number;
}

export interface TaskDetailsDto extends TaskDto {
	assignee: UserDto | null,
	comments: CommentDto[]
}