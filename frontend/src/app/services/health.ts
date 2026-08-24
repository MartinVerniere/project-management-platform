import { HttpClient } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { Observable } from 'rxjs/internal/Observable';

interface HealthResponse {
	status: string;
}

@Service()
export class Health {
	http: HttpClient = inject(HttpClient);

	getHealthStatus(): Observable<HealthResponse> {
		return this.http.get<HealthResponse>('http://localhost:3000/health');
	}
}
