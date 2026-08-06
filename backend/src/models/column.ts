import type { BoardResponse } from "./board.js";

export interface ColumnResponse {
	id: number;
	name: string;
	boardId: number;
	order: number;
}

export interface ColumnWithBoardResponse {
	id: number;
	name: string;
	board: BoardResponse;
	order: number;
}