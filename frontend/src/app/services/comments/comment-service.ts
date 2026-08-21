import { HttpClient } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { Observable } from 'rxjs';
import { UpdateCommentRequest } from '../../models/comment';
import type { CommentDto } from '@shared/models/comment';

const API_URL = 'http://localhost:3000/api/comments';

@Service()
export class CommentService {
	private http = inject(HttpClient);

	getComment(commentId: number): Observable<CommentDto> {
		return this.http.get<CommentDto>(`${API_URL}/${commentId}`);
	}

	updateComment(commentId: number, request: UpdateCommentRequest): Observable<CommentDto> {
		return this.http.put<CommentDto>(`${API_URL}/${commentId}`, request);
	}

	deleteComment(commentId: number): Observable<void> {
		return this.http.delete<void>(`${API_URL}/${commentId}`);
	}
}
