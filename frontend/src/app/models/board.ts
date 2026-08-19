interface ColumnOrderElement {
	id: number,
	order: number
}

export interface ColumnOrderRequest {
	columnOrder: ColumnOrderElement[]
}

export interface CreateBoardRequest {
	name: string,
}

export type UpdateBoardRequest = CreateBoardRequest;