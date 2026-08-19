import { UserDto } from "./user";

export interface CommentDto {
	id: number,
	content: string,
	user: UserDto,
}