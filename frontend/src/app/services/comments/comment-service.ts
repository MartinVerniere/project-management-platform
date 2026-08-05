import { HttpClient } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { Observable } from 'rxjs';
import { CommentResponse, UpdateCommentRequest, UpdateCommentResponse } from '../../models/comment';

const API_URL = 'http://localhost:3000/api/comments';

@Service()
export class CommentService {
	private http = inject(HttpClient);

	getComment(commentId: number): Observable<CommentResponse> {
		return this.http.get<CommentResponse>(`${API_URL}/${commentId}`);
	}

	updateComment(commentId: number, request: UpdateCommentRequest): Observable<UpdateCommentResponse> {
		return this.http.put<UpdateCommentResponse>(`${API_URL}/${commentId}`, request);
	}

	deleteComment(commentId: number): Observable<void> {
		return this.http.delete<void>(`${API_URL}/${commentId}`);
	}
}
