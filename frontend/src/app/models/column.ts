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