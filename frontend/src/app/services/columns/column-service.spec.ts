import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TaskModel } from '../../tasks/task-form/task-form';
import { ColumnService } from './column-service';
import type { ColumnDto } from '@shared/models/column';
import type { TaskDto } from '@shared/models/task';
import { TaskOrderRequest } from '../../models/column';

describe('ColumnService', () => {
	let service: ColumnService;
	let httpMock: HttpTestingController;

	const columnA: ColumnDto = {
		id: 1,
		name: "ToDo",
		boardId: 1,
		order: 0
	}

	const columnB: ColumnDto = {
		id: 2,
		name: "Finished",
		boardId: 0,
		order: 0
	}

	const taskA: TaskDto = {
		id: 1,
		title: 'Title A',
		columnId: 1,
		description: null,
		order: 0
	}

	function setupService() {
		httpMock = TestBed.inject(HttpTestingController);
		service = TestBed.inject(ColumnService);
	}

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

	it('should get column by id', () => {
		const expectedResponse = columnA;

		setupService();

		service.getColumn(columnA.id).subscribe((response) => {
			expect(response).toEqual(columnA);
		});

		const request = httpMock.expectOne(`http://localhost:3000/api/columns/${columnA.id}`);
		expect(request.request.method).toBe('GET');
		request.flush(expectedResponse);
	});

	it('should update column', () => {
		const updatedColumn = { name: "Updated B" };

		setupService();

		service.updateColumn(columnB.id, updatedColumn).subscribe();

		const request = httpMock.expectOne(`http://localhost:3000/api/columns/${columnB.id}`);
		expect(request.request.method).toBe('PUT');
		expect(request.request.body).toEqual(updatedColumn); 
		request.flush({});
	});

	it('should delete column', () => {
		setupService();

		service.deleteColumn(columnA.id).subscribe();

		const request = httpMock.expectOne(`http://localhost:3000/api/columns/${columnA.id}`);
		expect(request.request.method).toBe('DELETE');
		request.flush({});
	});

	it('should add task', () => {
		const newTask: TaskModel = { title: 'Task A', description: 'Desc' };
		const expectedResponse = taskA;

		setupService();

		service.addTask(columnA.id, newTask).subscribe((response) => {
			expect(response).toEqual(taskA);
		});

		const request = httpMock.expectOne(`http://localhost:3000/api/columns/${columnA.id}/tasks`);
		expect(request.request.method).toBe('POST');
		expect(request.request.body).toEqual(newTask); 
		request.flush(expectedResponse);
	});

	it('should edit task order', () => {
		const taskOrder: TaskOrderRequest = {
			taskOrder: [
				{ id: 1, order: 2 },
				{ id: 2, order: 1 }
			]
		};

		setupService();

		service.changeTaskOrder(columnA.id, taskOrder).subscribe();

		const request = httpMock.expectOne(`http://localhost:3000/api/columns/${columnA.id}/tasks/order`);
		expect(request.request.method).toBe('PUT');
		expect(request.request.body).toEqual(taskOrder); 
		request.flush({});
	});
});
