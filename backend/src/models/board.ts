import type { UserResponse } from "./user.js";

export interface BoardResponse {
	id: number;
	name: string;
	projectId: number;
};

export interface FullBoardResponse {
	id: number;
	name: string;
	projectId: number;
	columns: {
		id: number;
		name: string;
		order: number;
		tasks: {
			id: number;
			title: string;
			description: string | null;
			order: number;
			assignee: UserResponse | null;
			comments: {
				id: number;
				content: string;
				user: UserResponse;
			}[];
		}[];
	}[];
}