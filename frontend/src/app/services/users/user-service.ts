import { HttpClient } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import type { UserDto } from '@shared/models/user';
import { Observable } from 'rxjs';

const API_URL = 'http://localhost:3000/api/users';

@Service()
export class UserService {
	private http = inject(HttpClient);

	getUsers(): Observable<UserDto[]> {
		return this.http.get<UserDto[]>(`${API_URL}`);
	}

	getUser(id: number): Observable<UserDto> {
		return this.http.get<UserDto>(`${API_URL}/${id}`);
	}
}
