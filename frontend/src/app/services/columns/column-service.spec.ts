import { TestBed } from '@angular/core/testing';
import { Column, ColumnService, TaskOrderRequest } from './column-service';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TaskModel } from '../../tasks/task-form/task-form';
import { Task } from '../tasks/task-service';

const columnA: Column = {
	id: 1,
	name: "ToDo",
	tasks: []
}

const columnB: Column = {
	id: 2,
	name: "Finished",
	tasks: []
}

const taskA: Task = {
	id: 1,
	title: 'Title A',
	comments: []
}

describe('ColumnService', () => {
	let service: ColumnService;
	let httpMock: HttpTestingController;

	beforeEach(() => {
		vi.clearAllMocks();
		localStorage.clear();

		TestBed.configureTestingModule({
			providers: [
				provideHttpClient(),
				provideHttpClientTesting(),
			]
		});

		httpMock = TestBed.inject(HttpTestingController);
		service = TestBed.inject(ColumnService);
	});

	it('should be created', () => {
		expect(service).toBeTruthy();
	});

	it('should get column by id', () => {
		const expectedResponse = columnA;

		service.getColumn(columnA.id).subscribe();

		const request = httpMock.expectOne(`http://localhost:3000/api/columns/${columnA.id}`);

		expect(request.request.method).toBe('GET');

		request.flush(expectedResponse);
	});

	it('should update column', () => {
		const updatedColumn = { name: "Updated B" };

		service.updateColumn(columnB.id, updatedColumn).subscribe();

		const request = httpMock.expectOne(`http://localhost:3000/api/columns/${columnB.id}`);

		expect(request.request.method).toBe('PUT');

		request.flush({});
	});

	it('should delete column', () => {
		service.deleteColumn(columnA.id).subscribe();

		const request = httpMock.expectOne(`http://localhost:3000/api/columns/${columnA.id}`);

		expect(request.request.method).toBe('DELETE');

		request.flush({});
	});

	it('should add task', () => {
		const newTask: TaskModel = { title: 'Task A', description: 'Desc' };
		const expectedResponse = taskA;

		service.addTask(columnA.id, newTask).subscribe();

		const request = httpMock.expectOne(`http://localhost:3000/api/columns/${columnA.id}/tasks`);

		expect(request.request.method).toBe('POST');

		request.flush({ expectedResponse });
	});

	it('should edit task order', () => {
		const taskOrder: TaskOrderRequest = {
			taskOrder: [
				{ id: 1, order: 2 },
				{ id: 2, order: 1 }
			]
		};

		service.changeTaskOrder(columnA.id, taskOrder).subscribe();

		const request = httpMock.expectOne(`http://localhost:3000/api/columns/${columnA.id}/tasks/order`);

		expect(request.request.method).toBe('PUT');

		request.flush({});
	});
});
