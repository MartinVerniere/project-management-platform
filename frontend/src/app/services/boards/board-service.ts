import { HttpClient } from "@angular/common/http";
import { Service, inject } from "@angular/core";
import { Observable } from "rxjs";
import { ColumnOrderRequest, UpdateBoardRequest } from "../../models/board";
import { AddColumnRequest } from "../../models/column";
import { BoardDetailsDto } from "@shared/models/board";
import { ColumnDto } from "@shared/models/column";

const API_URL = 'http://localhost:3000/api/boards';

@Service()
export class BoardService {
	private http = inject(HttpClient);

	getBoard(boardId: number): Observable<BoardDetailsDto> {
		return this.http.get<BoardDetailsDto>(`${API_URL}/${boardId}`);
	}

	updateBoard(boardId: number, request: UpdateBoardRequest): Observable<BoardDetailsDto> {
		return this.http.put<BoardDetailsDto>(`${API_URL}/${boardId}`, request);
	}

	deleteBoard(boardId: number): Observable<void> {
		return this.http.delete<void>(`${API_URL}/${boardId}`);
	}

	createColumn(boardId: number, request: AddColumnRequest): Observable<ColumnDto> {
		return this.http.post<ColumnDto>(`${API_URL}/${boardId}/columns`, request);
	}

	changeColumnOrder(boardId: number, request: ColumnOrderRequest): Observable<BoardDetailsDto> {
		return this.http.put<BoardDetailsDto>(`${API_URL}/${boardId}/columns/order`, request);
	}
}
