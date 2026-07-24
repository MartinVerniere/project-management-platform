import { Component, inject, signal } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { ColumnService } from '../../services/columns/column-service';
import { form, required, submit } from '@angular/forms/signals';
import { HttpErrorResponse } from '@angular/common/http';

export interface TaskModel {
	title: string;
	description?: string;
}

@Component({
	selector: 'app-task-form',
	imports: [],
	templateUrl: './task-form.html',
	styleUrl: './task-form.css',
})
export class TaskForm {
	router = inject(Router);
	columnService = inject(ColumnService);
	route = inject(ActivatedRoute);

	projectId = Number(this.route.snapshot.paramMap.get('projectId'));
	boardId = Number(this.route.snapshot.paramMap.get('boardId'));
	columnId = Number(this.route.snapshot.paramMap.get('columnId'));

	taskModel = signal<TaskModel>({
		title: '',
		description: '',
	});

	error = signal<string | null>(null);

	taskForm = form(this.taskModel, (fieldPath) => {
		required(fieldPath.title, { message: 'Title is required' });
	});

	async onSubmit(event: Event) {
		event.preventDefault();

		submit(this.taskForm, async () => {
			if (this.taskModel().title === '') return;

			this.columnService.addTask(this.projectId, this.taskModel()).subscribe({
				next: () => {
					this.resetForm();
					this.error.set(null);
					this.router.navigate(['/projects', this.projectId, 'boards', this.boardId]);
				},
				error: (response: HttpErrorResponse) => {
					const errorObject = response.error.error;
					console.log(errorObject);
					this.error.set(errorObject.message);
				}
			});
		});
	}

	onCancel() {
		this.router.navigate(['/projects', this.projectId]);
	}

	resetForm() {
		this.taskModel.set({ title: '', description: '' });
		this.taskForm().reset();
	}
}
