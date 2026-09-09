import { HttpClient } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { Observable } from 'rxjs/internal/Observable';
import { environment } from '../../environments/environment';

interface HealthResponse {
	status: string;
}

const API_URL = `${environment.apiUrl}/health`;

@Service()
export class Health {
	http: HttpClient = inject(HttpClient);

	getHealthStatus(): Observable<HealthResponse> {
		return this.http.get<HealthResponse>(`${API_URL}`);
	}
}
