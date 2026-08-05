import { BoardResponse } from "./board";
import { UserResponse } from "./user";

export interface CreateProjectRequest {
	name: string;
	key: string;
	description: string;
}

export type UpdateProjectRequest = CreateProjectRequest;

export interface ProjectResponse {
    id: number;
    name: string;
    key: string;
    description: string | null;
	
}

export interface ProjectDetailsResponse extends ProjectResponse {
	members: ProjectMemberResponse[];
	boards: BoardResponse[];
}

export type CreateProjectResponse = ProjectResponse;
export type UpdateProjectResponse = ProjectResponse;

export type ProjectRole = 'ADMIN' | 'MEMBER';

export interface ProjectMemberResponse {
	id: number;
	role: ProjectRole;
	user: UserResponse;
}

export type AddMemberResponse = ProjectMemberResponse;