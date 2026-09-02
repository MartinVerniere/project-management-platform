import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AuthService } from './services/auth/auth-service';
import { Toast } from './toast/toast';

@Component({
	selector: 'app-root',
	imports: [RouterOutlet, Toast],
	templateUrl: './app.html',
	styleUrl: './app.css'
})
export class App {
	private authService = inject(AuthService);

	constructor(){
		this.authService.initializeAuth();
	}
}
