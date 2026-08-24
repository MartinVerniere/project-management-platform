import { TestBed } from '@angular/core/testing';
import { CommentService } from './comment-service';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import type { UserDto } from '@shared/models/user';
import type { CommentDto } from '@shared/models/comment';
import { UpdateCommentRequest } from '../../models/comment';

describe('CommentService', () => {
	let service: CommentService;
	let httpMock: HttpTestingController;

	const john: UserDto = { id: 1, username: 'john', email: 'john@test.com', avatarUrl: '/images/default-avatar.png' };
	const commentA: CommentDto = { id: 1, content: 'Comment A', author: john, taskId: 1 };
	const commentB: CommentDto = { id: 2, content: 'A', author: john, taskId: 1 };

	function setupService() {
		httpMock = TestBed.inject(HttpTestingController);
		service = TestBed.inject(CommentService);
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

	it('should get comment by id', () => {
		const expectedResponse = commentA;

		setupService();

		service.getComment(commentA.id).subscribe((response) => {
			expect(response).toEqual(commentA);
		});

		const request = httpMock.expectOne(`http://localhost:3000/api/comments/${commentA.id}`);
		expect(request.request.method).toBe('GET');
		request.flush(expectedResponse);
	});

	it('should update comment', () => {
		const updatedComment: UpdateCommentRequest = { content: "Updated comment" };

		setupService();

		service.updateComment(commentB.id, updatedComment).subscribe();

		const request = httpMock.expectOne(`http://localhost:3000/api/comments/${commentB.id}`);
		expect(request.request.method).toBe('PUT');
		expect(request.request.body).toEqual(updatedComment);
		request.flush({});
	});

	it('should delete comment', () => {
		setupService();

		service.deleteComment(commentA.id).subscribe();

		const request = httpMock.expectOne(`http://localhost:3000/api/comments/${commentA.id}`);
		expect(request.request.method).toBe('DELETE');
		request.flush({});
	});
});
