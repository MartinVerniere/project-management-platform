import { Component, inject, signal } from '@angular/core';
import { form, FormField, required, submit } from '@angular/forms/signals';
import { Router, RouterLink } from '@angular/router';
import { ProjectService } from '../../services/projects/project-service';
import { HttpErrorResponse } from '@angular/common/http';
import { ToastService } from '../../services/toast/toast-service';

export interface ProjectModel {
	name: string;
	key: string;
	description: string;
}

@Component({
	selector: 'app-project-form',
	imports: [FormField, RouterLink],
	templateUrl: './project-form.html',
	styleUrl: './project-form.css',
})

export class ProjectForm {
	router = inject(Router);
	projectService = inject(ProjectService);
	toastService = inject(ToastService);

	projectModel = signal<ProjectModel>({
		name: '',
		key: '',
		description: ''
	});
	error = signal<string | null>(null);

	projectForm = form(this.projectModel, (fieldPath) => {
		required(fieldPath.name, { message: 'Name is required' });
		required(fieldPath.key, { message: 'Key is required' });
	});

	async onSubmit(event: Event) {
		event.preventDefault();

		submit(this.projectForm, async () => {
			this.projectService.createProject(this.projectModel()).subscribe({
				next: () => {
					this.resetForm();
					this.error.set(null);
					this.toastService.success('Created project successfully.');
					this.router.navigate(['/projects']);
				},
				error: (response: HttpErrorResponse) => {
					const errorObject = response.error.error;
					console.log(errorObject);
					this.error.set(errorObject.message);
					this.toastService.error('Failed to create project.');
				}
			});

		});
	}

	resetForm() {
		this.projectModel.set({
			name: '',
			key: '',
			description: ''
		});
		this.projectForm().reset();
	}
}
