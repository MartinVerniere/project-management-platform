import { UserResponse } from "./user";

export type CommentAuthor = UserResponse;

export interface CommentResponse {
	id: number,
	content: string,
	user: CommentAuthor,
}

export interface UpdateCommentRequest {
	content: string;
}

export type UpdateCommentResponse = CommentResponse;