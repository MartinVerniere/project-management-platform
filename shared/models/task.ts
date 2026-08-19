import { CommentDto } from "./comment";
import { UserDto } from "./user";

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