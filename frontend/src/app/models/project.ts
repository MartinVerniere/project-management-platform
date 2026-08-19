export interface CreateProjectRequest {
	name: string;
	key: string;
	description: string;
}

export type UpdateProjectRequest = CreateProjectRequest;