import { ColumnResponse } from "./column";

export interface BoardResponse {
	id: number,
	name: string,
	columns: ColumnResponse[]
}

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

export type CreateBoardResponse = BoardResponse;
export type UpdateBoardResponse = BoardResponse;
export type CreateColumnResponse = BoardResponse;
export type ColumnOrderResponse = BoardResponse;