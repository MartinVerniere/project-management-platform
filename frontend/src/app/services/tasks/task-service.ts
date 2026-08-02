import { HttpClient } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { Observable } from 'rxjs';
import { TaskModel } from '../../tasks/task-form/task-form';
import { Comment } from '../comments/comment-service';
import { CommentModel } from '../../comments/comment-form/comment-form';
import { User } from '../users/user-service';

const API_URL = 'http://localhost:3000/api/tasks';

export interface Task {
	id: number,
	title: string,
	description?: string,
	assignee?: User,
	comments: Comment[]
}

@Service()
export class TaskService {
	private http = inject(HttpClient);

	getTask(taskId: number): Observable<Task> {
		return this.http.get<Task>(`${API_URL}/${taskId}`);
	}

	updateTask(taskId: number, request: TaskModel): Observable<Task> {
		return this.http.put<Task>(`${API_URL}/${taskId}`, request);
	}

	deleteTask(taskId: number): Observable<void> {
		return this.http.delete<void>(`${API_URL}/${taskId}`);
	}

	moveTask(taskId: number, destinationColumnId: number): Observable<Task> {
		return this.http.put<Task>(`${API_URL}/${taskId}/column`, { columnId: destinationColumnId });
	}

	assignTask(taskId: number, userId: number): Observable<Task> {
		return this.http.put<Task>(`${API_URL}/${taskId}/assignee`, { userId });
	}

	unassignTask(taskId: number): Observable<Task> {
		return this.http.delete<Task>(`${API_URL}/${taskId}/assignee`);
	}

	addComment(taskId: number, request: CommentModel): Observable<Comment> {
		return this.http.post<Comment>(`${API_URL}/${taskId}/comments`, request);
	}
}
