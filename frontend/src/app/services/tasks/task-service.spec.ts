import { TestBed } from '@angular/core/testing';

import { Task, TaskService } from './task-service';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { TaskModel } from '../../tasks/task-form/task-form';
import { Comment } from '../comments/comment-service';

const taskA: Task = {
	id: 1,
	title: 'Title A',
	description: 'Description',
	comments: []
}

const taskB: Task = {
	id: 2,
	title: 'Title B',
	comments: []
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

	it('should move task to another column', () => {
		const destinationColumnId = 2;

		service.moveTask(taskA.id, destinationColumnId).subscribe();

		const request = httpMock.expectOne(`http://localhost:3000/api/tasks/${taskA.id}/column`);

		expect(request.request.method).toBe('PUT');
		expect(request.request.body).toEqual({ columnId: destinationColumnId });

		request.flush({});
	});

	it('should add comment to task', () => {
		const newComment: Comment = {
			id: 1,
			content: 'Good work!',
			user: {
				id: 1,
				username: 'john'
			}
		}

		service.addComment(taskA.id, newComment).subscribe();

		const request = httpMock.expectOne(`http://localhost:3000/api/tasks/${taskA.id}/comments`);

		expect(request.request.method).toBe('POST');

		request.flush({});
	});
});
