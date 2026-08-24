import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { BoardService } from './board-service';
import { AddColumnRequest } from '../../models/column';
import { ColumnOrderRequest, UpdateBoardRequest } from '../../models/board';
import { BoardDetailsDto } from '@shared/models/board';
import { ColumnDto } from '@shared/models/column';

describe('BoardService', () => {
	let service: BoardService;
	let httpMock: HttpTestingController;

	const boardA: BoardDetailsDto = { id: 1, name: "Board A", columns: [], projectId: 1 };
	const boardB: BoardDetailsDto = { id: 2, name: "Board B", columns: [], projectId: 1 };
	const column1: ColumnDto = { id: 1, name: "ToDo", order: 1, boardId: 1 };

	function setupService() {
		httpMock = TestBed.inject(HttpTestingController);
		service = TestBed.inject(BoardService);
	};

	beforeEach(() => {
		vi.clearAllMocks();
		localStorage.clear();

		TestBed.configureTestingModule({
			providers: [
				provideHttpClient(),
				provideHttpClientTesting(),
			]
		});
	});

	it('should be created', () => {
		setupService();
		expect(service).toBeTruthy();
	});

	it('should get board by id', () => {
		const expectedResponse = boardA;

		setupService();

		service.getBoard(boardA.id).subscribe((response) => {
			expect(response).toEqual(boardA);
		});

		const request = httpMock.expectOne(`http://localhost:3000/api/boards/${boardA.id}`);
		expect(request.request.method).toBe('GET');
		request.flush(expectedResponse);
	});

	it('should update board', () => {
		const updatedBoard: UpdateBoardRequest = { name: "Updated B" };

		setupService();

		service.updateBoard(boardB.id, updatedBoard).subscribe();

		const request = httpMock.expectOne(`http://localhost:3000/api/boards/${boardB.id}`);
		expect(request.request.method).toBe('PUT');
		expect(request.request.body).toEqual(updatedBoard);
		request.flush({});
	});

	it('should delete board', () => {
		setupService();

		service.deleteBoard(boardB.id).subscribe();

		const request = httpMock.expectOne(`http://localhost:3000/api/boards/${boardB.id}`);
		expect(request.request.method).toBe('DELETE');
		request.flush({});
	});

	it('should create column', () => {
		const column: AddColumnRequest = { name: "ToDo" };

		setupService();

		service.createColumn(boardB.id, column).subscribe((response) => {
			expect(response).toEqual(column1);
		});

		const request = httpMock.expectOne(`http://localhost:3000/api/boards/${boardB.id}/columns`);
		expect(request.request.method).toBe('POST');
		expect(request.request.body).toEqual(column);
		request.flush(column1);
	});

	it('should change column order', () => {
		const columnOrder: ColumnOrderRequest = {
			columnOrder: [
				{ id: 1, order: 2 },
				{ id: 2, order: 1 }
			]
		};

		setupService();

		service.changeColumnOrder(boardB.id, columnOrder).subscribe();

		const request = httpMock.expectOne(`http://localhost:3000/api/boards/${boardB.id}/columns/order`);
		expect(request.request.method).toBe('PUT');
		expect(request.request.body).toEqual(columnOrder);
		request.flush({});
	});
});
