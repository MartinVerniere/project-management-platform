import { Component, inject, signal } from '@angular/core';
import { form, FormField, required, submit } from '@angular/forms/signals';
import { Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthService } from '../../services/auth/auth-service';
import { ToastService } from '../../services/toast/toast-service';

interface LoginModel {
	username: string;
	password: string;
}

@Component({
	selector: 'app-login',
	imports: [FormField, RouterLink],
	templateUrl: './login.html',
	styleUrl: './login.css',
})
export class Login {
	authService = inject(AuthService);
	router = inject(Router);
	toastService = inject(ToastService);

	loginModel = signal<LoginModel>({
		username: '',
		password: '',
	});
	error = signal<string | null>(null);

	loginForm = form(this.loginModel, (fieldPath) => {
		required(fieldPath.username, { message: 'Username is required' });
		required(fieldPath.password, { message: 'Password is required' });
	});

	async onSubmit(event: Event) {
		event.preventDefault();

		submit(this.loginForm, async () => {
			this.authService.login(this.loginModel()).subscribe({
				next: () => {
					this.resetForm();
					this.error.set(null);
					this.router.navigate(['/']);
				},
				error: (response: HttpErrorResponse) => {
					const errorObject = response.error.error;
					console.log(errorObject);
					this.error.set(errorObject.message);
					this.toastService.error('Failed to log in.');
				}
			});
		});
	}

	resetForm() {
		this.loginModel.set({
			username: '',
			password: '',
		});
		this.loginForm().reset();
	}
}
