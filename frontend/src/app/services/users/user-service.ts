import { HttpClient } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { Observable } from 'rxjs';
import { UserResponse } from '../../models/user';

const API_URL = 'http://localhost:3000/api/users';

@Service()
export class UserService {
	private http = inject(HttpClient);

	getUsers(): Observable<UserResponse[]> {
		return this.http.get<UserResponse[]>(`${API_URL}`);
	}

	getUser(id: number): Observable<UserResponse> {
		return this.http.get<UserResponse>(`${API_URL}/${id}`);
	}
}
