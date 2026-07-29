import { HttpClient } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { Observable } from 'rxjs';
import { CommentModel } from '../../comments/comment-form/comment-form';

const API_URL = 'http://localhost:3000/api/comments';

export interface CommentAuthor {
	id: number,
	username: string
}

export interface Comment {
	id: number,
	content: string,
	user: CommentAuthor,
}

@Service()
export class CommentService {
	private http = inject(HttpClient);

	getComment(commentId: number): Observable<Comment> {
		return this.http.get<Comment>(`${API_URL}/${commentId}`);
	}

	updateComment(commentId: number, request: CommentModel): Observable<Comment> {
		return this.http.put<Comment>(`${API_URL}/${commentId}`, request);
	}

	deleteComment(commentId: number): Observable<void> {
		return this.http.delete<void>(`${API_URL}/${commentId}`);
	}
}
