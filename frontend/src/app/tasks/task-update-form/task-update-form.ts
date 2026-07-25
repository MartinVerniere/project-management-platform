import { Component, effect, inject, resource, signal } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { TaskService } from '../../services/tasks/task-service';
import { firstValueFrom } from 'rxjs';
import { TaskModel } from '../task-form/task-form';
import { form, required, submit } from '@angular/forms/signals';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
	selector: 'app-task-update-form',
	imports: [],
	templateUrl: './task-update-form.html',
	styleUrl: './task-update-form.css',
})
export class TaskUpdateForm {
	router = inject(Router);
	taskService = inject(TaskService);
	route = inject(ActivatedRoute);

	projectId = Number(this.route.snapshot.paramMap.get('projectId'));
	boardId = Number(this.route.snapshot.paramMap.get('boardId'));
	columnId = Number(this.route.snapshot.paramMap.get('columnId'));
	taskId = Number(this.route.snapshot.paramMap.get('taskId'));

	currentTask = resource({ loader: () => firstValueFrom(this.taskService.getTask(this.taskId)) });

	taskModel = signal<TaskModel>({ title: '', description: '' });

	taskForm = form(this.taskModel, (fieldPath) => {
		required(fieldPath.title, { message: 'Title is required' });
	});

	error = signal<string | null>(null);

	constructor() {
		effect(() => {
			const task = this.currentTask.value();

			if (!task) return;

			this.taskModel.set({ title: task.title });
		});
	}

	async onSubmit(event: Event) {
		event.preventDefault();

		submit(this.taskForm, async () => {
			const value = this.taskForm().value();

			this.taskService.updateTask(this.taskId, value).subscribe({
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
		this.router.navigate(['/projects', this.projectId, 'boards', this.boardId]);
	}

	resetForm() {
		this.taskModel.set({ title: '', description: '' });
		this.taskForm().reset();
	}
}
