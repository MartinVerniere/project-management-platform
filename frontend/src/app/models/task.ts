export interface AddTaskRequest {
	title: string;
	description: string;
}

export type UpdateTaskRequest = AddTaskRequest;