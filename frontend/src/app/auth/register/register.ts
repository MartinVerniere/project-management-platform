import { Component, inject, signal } from '@angular/core';
import { email, form, FormField, required, submit } from '@angular/forms/signals';
import { Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthService } from '../../services/auth/auth-service';

interface RegisterModel {
	username: string;
	email: string;
	password: string;
	avatar: File | null;
}

@Component({
	selector: 'app-register',
	imports: [FormField, RouterLink],
	templateUrl: './register.html',
	styleUrl: './register.css',
})
export class Register {
	authService = inject(AuthService);
	router = inject(Router);

	registerModel = signal<RegisterModel>({
		username: '',
		email: '',
		password: '',
		avatar: null
	});
	avatarPreview = signal('/images/default-avatar.png');

	avatarFile: File | null = null;

	error = signal<string | null>(null);

	registerForm = form(this.registerModel, (fieldPath) => {
		required(fieldPath.username, { message: 'Username is required' });
		required(fieldPath.email, { message: 'Email is required' });
		email(fieldPath.email, { message: 'Must be a valid email format' });
		required(fieldPath.password, { message: 'Password is required' });
	});

	onAvatarSelected(event: Event) {
		const input = event.target as HTMLInputElement;
		const file = input.files?.[0];
		if (!file) return;

		this.registerModel.update(model => ({ ...model, avatar: file }));
		this.avatarPreview.set(URL.createObjectURL(file));
	}

	async onSubmit(event: Event) {
		event.preventDefault();

		submit(this.registerForm, async () => {
			const formData = new FormData();

			formData.append('username', this.registerModel().username);
			formData.append('email', this.registerModel().email);
			formData.append('password', this.registerModel().password);

			const avatar = this.registerModel().avatar;
			if (avatar) { formData.append('avatar', avatar); }

			this.authService.register(formData).subscribe({
				next: () => {
					this.resetForm();
					this.error.set(null);
					this.router.navigate(['/login']);
				},
				error: (response: HttpErrorResponse) => {
					const errorObject = response.error.error;
					console.log(errorObject);
					this.error.set(errorObject.message);
				}
			});
		});
	}

	resetForm() {
		this.registerModel.set({
			username: '',
			email: '',
			password: '',
			avatar: null
		});
		this.avatarFile = null;
		this.registerForm().reset();
	}
}
