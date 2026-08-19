import { UserDto } from "../../../../shared/models/user";

export type CommentAuthor = UserDto;

export interface CommentResponse {
	id: number,
	content: string,
	user: CommentAuthor,
}

export interface AddCommentRequest {
	content: string;
}

export type UpdateCommentRequest = AddCommentRequest;