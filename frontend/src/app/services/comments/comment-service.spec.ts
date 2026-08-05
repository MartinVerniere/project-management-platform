import { TestBed } from '@angular/core/testing';

import { CommentService } from './comment-service';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { CommentModel } from '../../comments/comment-form/comment-form';
import { CommentAuthor, CommentResponse } from '../../models/comment';

const john: CommentAuthor = {
	id: 1,
	username: 'john',
	email: 'john@test.com'
}

const commentA: CommentResponse = {
	id: 1,
	content: 'Comment A',
	user: john
}

const commentB: CommentResponse = {
	id: 2,
	content: 'A',
	user: john
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
