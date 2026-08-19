import { HttpClient } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { Observable } from 'rxjs';
import { TaskDetailsDto, TaskDto } from '../../../../../shared/models/task';
import { UpdateTaskRequest } from '../../models/task';
import { CommentDto } from '../../../../../shared/models/comment';
import { AddCommentRequest } from '../../models/comment';

const API_URL = 'http://localhost:3000/api/tasks';

@Service()
export class TaskService {
	private http = inject(HttpClient);

	getTask(taskId: number): Observable<TaskDto> {
		return this.http.get<TaskDto>(`${API_URL}/${taskId}`);
	}

	updateTask(taskId: number, request: UpdateTaskRequest): Observable<TaskDto> {
		return this.http.put<TaskDto>(`${API_URL}/${taskId}`, request);
	}

	deleteTask(taskId: number): Observable<void> {
		return this.http.delete<void>(`${API_URL}/${taskId}`);
	}

	moveTask(taskId: number, destinationColumnId: number): Observable<TaskDto> {
		return this.http.put<TaskDto>(`${API_URL}/${taskId}/column`, { columnId: destinationColumnId });
	}

	assignTask(taskId: number, userId: number): Observable<TaskDetailsDto> {
		return this.http.put<TaskDetailsDto>(`${API_URL}/${taskId}/assignee`, { userId });
	}

	unassignTask(taskId: number): Observable<TaskDetailsDto> {
		return this.http.delete<TaskDetailsDto>(`${API_URL}/${taskId}/assignee`);
	}

	addComment(taskId: number, request: AddCommentRequest): Observable<CommentDto> {
		return this.http.post<CommentDto>(`${API_URL}/${taskId}/comments`, request);
	}
}
