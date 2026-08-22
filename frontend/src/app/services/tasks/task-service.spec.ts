import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { TaskService } from './task-service';
import type { TaskDto } from '@shared/models/task';
import { UpdateTaskRequest } from '../../models/task';
import { AddCommentRequest } from '../../models/comment';


describe('TaskService', () => {
	let service: TaskService;
	let httpMock: HttpTestingController;

	const taskA: TaskDto = {
		id: 1,
		title: 'Title A',
		description: 'Description',
		columnId: 1,
		order: 0
	}

	const taskB: TaskDto = {
		id: 2,
		title: 'Title B',
		description: null,
		columnId: 1,
		order: 1
	}

	function setupService() {
		httpMock = TestBed.inject(HttpTestingController);
		service = TestBed.inject(TaskService);
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

	it('should get task by id', () => {
		const expectedResponse = taskA;

		setupService();

		service.getTask(taskA.id).subscribe((response) => {
			expect(response).toEqual(taskA);
		});

		const request = httpMock.expectOne(`http://localhost:3000/api/tasks/${taskA.id}`);
		expect(request.request.method).toBe('GET');
		request.flush(expectedResponse);
	});

	it('should update task', () => {
		const updatedTask: UpdateTaskRequest = { title: "Updated B", description: '' };

		setupService();

		service.updateTask(taskB.id, updatedTask).subscribe();

		const request = httpMock.expectOne(`http://localhost:3000/api/tasks/${taskB.id}`);
		expect(request.request.method).toBe('PUT');
		expect(request.request.body).toEqual(updatedTask); 
		request.flush({});
	});

	it('should delete task', () => {
		setupService();

		service.deleteTask(taskA.id).subscribe();

		const request = httpMock.expectOne(`http://localhost:3000/api/tasks/${taskA.id}`);
		expect(request.request.method).toBe('DELETE');
		request.flush({});
	});

	it('should move task to another column', () => {
		const destinationColumnId = 2;

		setupService();

		service.moveTask(taskA.id, destinationColumnId).subscribe();

		const request = httpMock.expectOne(`http://localhost:3000/api/tasks/${taskA.id}/column`);
		expect(request.request.method).toBe('PUT');
		expect(request.request.body).toEqual({ columnId: destinationColumnId });
		request.flush({});
	});

	it('should assign user to task', () => {
		const userId = 1;

		setupService();

		service.assignTask(taskA.id, userId).subscribe();

		const request = httpMock.expectOne(`http://localhost:3000/api/tasks/${taskA.id}/assignee`);
		expect(request.request.method).toBe('PUT');
		expect(request.request.body).toEqual({ userId: userId });
		request.flush({});
	});

	it('should remove assigned user from task', () => {
		setupService();

		service.unassignTask(taskA.id).subscribe();

		const request = httpMock.expectOne(`http://localhost:3000/api/tasks/${taskA.id}/assignee`);
		expect(request.request.method).toBe('DELETE');
		request.flush({});
	});

	it('should add comment to task', () => {
		const newComment: AddCommentRequest = { content: 'Good work!' }

		setupService();

		service.addComment(taskA.id, newComment).subscribe();

		const request = httpMock.expectOne(`http://localhost:3000/api/tasks/${taskA.id}/comments`);
		expect(request.request.method).toBe('POST');
		expect(request.request.body).toEqual(newComment); 
		request.flush({});
	});
}); 
