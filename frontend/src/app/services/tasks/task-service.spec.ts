import { TestBed } from '@angular/core/testing';

import { Task, TaskService } from './task-service';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { TaskModel } from '../../tasks/task-form/task-form';

const taskA: Task = {
	id: 1,
	title: 'Title A',
	description: 'Description'
}

const taskB: Task = {
	id: 2,
	title: 'Title B'
}

describe('TaskService', () => {
	let service: TaskService;
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
		service = TestBed.inject(TaskService);
	});

	it('should be created', () => {
		expect(service).toBeTruthy();
	});

	it('should get task by id', () => {
		const expectedResponse = taskA;

		service.getTask(taskA.id).subscribe();

		const request = httpMock.expectOne(`http://localhost:3000/api/tasks/${taskA.id}`);

		expect(request.request.method).toBe('GET');

		request.flush(expectedResponse);
	});

	it('should update task', () => {
		const updatedTask: TaskModel = { title: "Updated B", description: '' };

		service.updateTask(taskB.id, updatedTask).subscribe();

		const request = httpMock.expectOne(`http://localhost:3000/api/tasks/${taskB.id}`);

		expect(request.request.method).toBe('PUT');

		request.flush({});
	});

	it('should delete task', () => {
		service.deleteTask(taskA.id).subscribe();

		const request = httpMock.expectOne(`http://localhost:3000/api/tasks/${taskA.id}`);

		expect(request.request.method).toBe('DELETE');

		request.flush({});
	});
});
