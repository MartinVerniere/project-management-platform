import type { UserDto } from "./user.js";

export interface CommentDto {
	id: number,
	content: string,
	taskId: number,
	author: UserDto,
}