import { HttpClient } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { Observable } from 'rxjs';
import { TaskModel } from '../../tasks/task-form/task-form';
import { Comment } from '../comments/comment-service';
import { CommentModel } from '../../comments/comment-form/comment-form';
import { AssignTaskResponse, MoveTaskResponse, TaskResponse, UnnassignTaskResponse, UpdateTaskResposne } from '../../models/task';

const API_URL = 'http://localhost:3000/api/tasks';

@Service()
export class TaskService {
	private http = inject(HttpClient);

	getTask(taskId: number): Observable<TaskResponse> {
		return this.http.get<TaskResponse>(`${API_URL}/${taskId}`);
	}

	updateTask(taskId: number, request: TaskModel): Observable<UpdateTaskResposne> {
		return this.http.put<UpdateTaskResposne>(`${API_URL}/${taskId}`, request);
	}

	deleteTask(taskId: number): Observable<void> {
		return this.http.delete<void>(`${API_URL}/${taskId}`);
	}

	moveTask(taskId: number, destinationColumnId: number): Observable<MoveTaskResponse> {
		return this.http.put<MoveTaskResponse>(`${API_URL}/${taskId}/column`, { columnId: destinationColumnId });
	}

	assignTask(taskId: number, userId: number): Observable<AssignTaskResponse> {
		return this.http.put<AssignTaskResponse>(`${API_URL}/${taskId}/assignee`, { userId });
	}

	unassignTask(taskId: number): Observable<UnnassignTaskResponse> {
		return this.http.delete<UnnassignTaskResponse>(`${API_URL}/${taskId}/assignee`);
	}

	addComment(taskId: number, request: CommentModel): Observable<Comment> {
		return this.http.post<Comment>(`${API_URL}/${taskId}/comments`, request);
	}
}
