import { Component, inject } from '@angular/core';
import { Health } from '../services/health';
import { RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
	selector: 'app-home',
	imports: [RouterLink],
	templateUrl: './home.html',
	styleUrl: './home.css',
})
export class Home {
	healthService = inject(Health);

	onClick() {
		console.log('Checking health status...');

		this.healthService.getHealthStatus().subscribe({
			next: (response) => {
				console.log('Health status:', response);
			},
			error: (response: HttpErrorResponse) => {
				const errorObject = response.error.error;
				console.log(errorObject);
			}
		});
	}
}
