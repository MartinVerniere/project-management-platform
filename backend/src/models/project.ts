import type { ProjectRole } from "../generated/prisma/enums.js";
import type { BoardResponse } from "./board.js";
import type { UserResponse } from "./user.js";

export interface ProjectResponse {
	id: number;
	name: string;
	key: string;
	description: string | null;
}

export interface ProjectWithBoardsResponse {
	id: number;
	name: string;
	key: string;
	description: string | null;
	boards: BoardResponse[];
}

export interface ProjectMemberResponse {
	id: number;
	role: ProjectRole;
	user: UserResponse;
}