import { HttpClient } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { Observable } from 'rxjs';
import { TaskOrderRequest, UpdateColumnRequest } from '../../models/column';
import { AddTaskRequest } from '../../models/task';
import { ColumnDetailsDto, ColumnDto } from '@shared/models/column';
import type { TaskDto } from '@shared/models/task';

const API_URL = 'http://localhost:3000/api/columns';

@Service()
export class ColumnService {
	private http = inject(HttpClient);

	getColumn(columnId: number): Observable<ColumnDto> {
		return this.http.get<ColumnDto>(`${API_URL}/${columnId}`);
	}

	updateColumn(columnId: number, request: UpdateColumnRequest): Observable<ColumnDto> {
		return this.http.put<ColumnDto>(`${API_URL}/${columnId}`, request);
	}

	deleteColumn(columnId: number): Observable<void> {
		return this.http.delete<void>(`${API_URL}/${columnId}`);
	}

	addTask(columnId: number, request: AddTaskRequest): Observable<TaskDto> {
		return this.http.post<TaskDto>(`${API_URL}/${columnId}/tasks`, request);
	}

	changeTaskOrder(columnId: number, request: TaskOrderRequest): Observable<ColumnDetailsDto> {
		return this.http.put<ColumnDetailsDto>(`${API_URL}/${columnId}/tasks/order`, request);
	}
}
