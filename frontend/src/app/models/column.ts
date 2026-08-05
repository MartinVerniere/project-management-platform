import { Task } from "../services/tasks/task-service"

export interface ColumnResponse {
	id: number,
	name: string,
	tasks: Task[]
}

interface TaskOrder {
	id: number,
	order: number
}

export interface TaskOrderRequest {
	taskOrder: TaskOrder[]
}

export interface AddColumnRequest {
	name: string;
}

export type UpdateColumnRequest = AddColumnRequest;
export type AddTaskResponse = ColumnResponse;
export type ChangeTaskOrderResponse = ColumnResponse;