import { TestBed } from '@angular/core/testing';

import { CommentService } from './comment-service';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { CommentModel } from '../../comments/comment-form/comment-form';
import type { UserDto } from '@shared/models/user';
import type { CommentDto } from '@shared/models/comment';

const john: UserDto = {
	id: 1,
	username: 'john',
	email: 'john@test.com',
	avatarUrl: '/images/default-avatar.png'
}

const commentA: CommentDto = {
	id: 1,
	content: 'Comment A',
	author: john,
	taskId: 1
}

const commentB: CommentDto = {
	id: 2,
	content: 'A',
	author: john,
	taskId: 1
}

describe('CommentService', () => {
	let service: CommentService;
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
		service = TestBed.inject(CommentService);
	});

	it('should be created', () => {
		expect(service).toBeTruthy();
	});

	it('should get task by id', () => {
		service.getComment(commentA.id).subscribe();

		const request = httpMock.expectOne(`http://localhost:3000/api/comments/${commentA.id}`);

		expect(request.request.method).toBe('GET');

		request.flush({});
	});

	it('should update task', () => {
		const updatedTask: CommentModel = { content: "Updated comment" };

		service.updateComment(commentB.id, updatedTask).subscribe();

		const request = httpMock.expectOne(`http://localhost:3000/api/comments/${commentB.id}`);

		expect(request.request.method).toBe('PUT');

		request.flush({});
	});

	it('should delete task', () => {
		service.deleteComment(commentA.id).subscribe();

		const request = httpMock.expectOne(`http://localhost:3000/api/comments/${commentA.id}`);

		expect(request.request.method).toBe('DELETE');

		request.flush({});
	});
});
