import { HttpClient } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { Observable } from 'rxjs';
import { TaskModel } from '../../tasks/task-form/task-form';

const API_URL = 'http://localhost:3000/api/tasks';

export interface Comment {
	id: number,
	content: string,
}

export interface Task {
	id: number,
	title: string,
	description?: string,
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
}
