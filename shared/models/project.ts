import type { BoardDto } from "./board.js";
import type { UserDto } from "./user.js";

type ProjectRole = 'ADMIN' | 'MEMBER';

export interface ProjectMemberDto {
	id: number;
	role: ProjectRole;
	user: UserDto;
}

export interface ProjectDto {
    id: number;
    name: string;
    key: string;
    description: string | null;
}

export interface ProjectDetailsDto extends ProjectDto {
	members: ProjectMemberDto[];
	boards: BoardDto[];
}