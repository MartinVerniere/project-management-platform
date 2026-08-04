import type { ProjectRole } from "../generated/prisma/enums.js";
import type { UserResponse } from "./user.js";

export interface ProjectResponse {
	id: number;
	name: string;
	key: string;
	description: string | null;
	members: ProjectMemberResponse[];
}

export interface ProjectMemberResponse {
	id: number;
	role: ProjectRole;
	user: UserResponse;
}