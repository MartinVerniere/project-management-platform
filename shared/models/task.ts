import { CommentDto } from "./comment";
import { UserDto } from "./user";

export interface TaskDto {
	id: number,
	title: string,
	description?: string,
	columnId: number
}

export interface TaskDetailsDto extends TaskDto {
	assignee?: UserDto,
	comments: CommentDto[]
}