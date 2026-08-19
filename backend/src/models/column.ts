import type { BoardDto } from "../../../shared/models/board.js";

export interface ColumnWithBoardResponse {
	id: number;
	name: string;
	board: BoardDto;
	order: number;
}