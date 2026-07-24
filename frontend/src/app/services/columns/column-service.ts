import { HttpClient } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { Observable } from 'rxjs';
import { ColumnModel } from '../../columns/column-form/column-form';
import { Task } from '../tasks/task-service';
import { TaskModel } from '../../tasks/task-form/task-form';

const API_URL = 'http://localhost:3000/api/columns';

export interface Column {
	id: number,
	name: string,
	tasks: Task[]
}

@Service()
export class ColumnService {
	private http = inject(HttpClient);

	getColumn(columnId: number): Observable<Column> {
		return this.http.get<Column>(`${API_URL}/${columnId}`);
	}

	updateColumn(columnId: number, request: ColumnModel): Observable<Column> {
		return this.http.put<Column>(`${API_URL}/${columnId}`, request);
	}

	deleteColumn(columnId: number): Observable<void> {
		return this.http.delete<void>(`${API_URL}/${columnId}`);
	}

	addTask(columnId: number, request: TaskModel): Observable<Column> {
		return this.http.post<Column>(`${API_URL}/${columnId}/tasks`, request);
	}
}
