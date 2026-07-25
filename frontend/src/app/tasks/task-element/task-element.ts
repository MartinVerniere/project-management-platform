import { Component, inject, input, output, signal } from '@angular/core';
import { Task, TaskService } from '../../services/tasks/task-service';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
	selector: 'app-task-element',
	imports: [],
	templateUrl: './task-element.html',
	styleUrl: './task-element.css',
})
export class TaskElement {
	taskService = inject(TaskService);

	task = input.required<Task>();
	isFirst = input<boolean>();
	isLast = input<boolean>();

	taskDeleted = output<void>();
	moveUp = output<number>();
	moveDown = output<number>();

	error = signal<string | null>(null);

	onTaskDeleted(taskId: number) {
		this.taskService.deleteTask(taskId).subscribe({
			next: () => {
				this.taskDeleted.emit();
				this.error.set(null);
			},
			error: (response: HttpErrorResponse) => {
				const errorObject = response.error.error;
				console.log(errorObject);
				this.error.set(errorObject.message);
			}
		});
	}
}
