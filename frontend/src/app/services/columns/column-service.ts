import { HttpClient } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { Observable } from 'rxjs';
import { ColumnModel } from '../../columns/column-form/column-form'
import { TaskModel } from '../../tasks/task-form/task-form';
import { AddTaskResponse, ChangeTaskOrderResponse, ColumnResponse, TaskOrderRequest, UpdateColumnRequest } from '../../models/column';

const API_URL = 'http://localhost:3000/api/columns';

@Service()
export class ColumnService {
	private http = inject(HttpClient);

	getColumn(columnId: number): Observable<ColumnResponse> {
		return this.http.get<ColumnResponse>(`${API_URL}/${columnId}`);
	}

	updateColumn(columnId: number, request: ColumnModel): Observable<UpdateColumnRequest> {
		return this.http.put<UpdateColumnRequest>(`${API_URL}/${columnId}`, request);
	}

	deleteColumn(columnId: number): Observable<void> {
		return this.http.delete<void>(`${API_URL}/${columnId}`);
	}

	addTask(columnId: number, request: TaskModel): Observable<AddTaskResponse> {
		return this.http.post<AddTaskResponse>(`${API_URL}/${columnId}/tasks`, request);
	}

	changeTaskOrder(columnId: number, request: TaskOrderRequest): Observable<ChangeTaskOrderResponse> {
		return this.http.put<ChangeTaskOrderResponse>(`${API_URL}/${columnId}/tasks/order`, request);
	}
}
