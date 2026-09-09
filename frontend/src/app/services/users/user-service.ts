import { HttpClient } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import type { UserDto } from '@shared/models/user';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

const API_URL = `${environment.apiUrl}/api/users`; 

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
