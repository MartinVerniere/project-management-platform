import { HttpClient } from "@angular/common/http";
import { Service, inject } from "@angular/core";
import { Observable } from "rxjs";
import { BoardModel } from "../../boards/board-form/board-form";
import { ColumnModel } from "../../columns/column-form/column-form";
import { BoardResponse, ColumnOrderRequest, ColumnOrderResponse, CreateColumnResponse, UpdateBoardResponse } from "../../models/board";

const API_URL = 'http://localhost:3000/api/boards';

@Service()
export class BoardService {
	private http = inject(HttpClient);

	getBoard(boardId: number): Observable<BoardResponse> {
		return this.http.get<BoardResponse>(`${API_URL}/${boardId}`);
	}

	updateBoard(boardId: number, request: BoardModel): Observable<UpdateBoardResponse> {
		return this.http.put<UpdateBoardResponse>(`${API_URL}/${boardId}`, request);
	}

	deleteBoard(boardId: number): Observable<void> {
		return this.http.delete<void>(`${API_URL}/${boardId}`);
	}

	createColumn(boardId: number, request: ColumnModel): Observable<CreateColumnResponse> {
		return this.http.post<CreateColumnResponse>(`${API_URL}/${boardId}/columns`, request);
	}

	changeColumnOrder(boardId: number, request: ColumnOrderRequest): Observable<ColumnOrderResponse> {
		return this.http.put<ColumnOrderResponse>(`${API_URL}/${boardId}/columns/order`, request);
	}
}
