import { UserDto } from "./user";

export interface CommentDto {
	id: number,
	content: string,
	taskId: number,
	author: UserDto,
}