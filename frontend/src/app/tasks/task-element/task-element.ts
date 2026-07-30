import { Component, inject, input, output, signal } from '@angular/core';
import { Task, TaskService } from '../../services/tasks/task-service';
import { HttpErrorResponse } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { CommentList } from '../../comments/comment-list/comment-list';

@Component({
	selector: 'app-task-element',
	imports: [RouterLink, CommentList],
	templateUrl: './task-element.html',
	styleUrl: './task-element.css',
})
export class TaskElement {
	taskService = inject(TaskService);

	task = input.required<Task>();
	projectId = input.required<number>();
	boardId = input.required<number>();
	columnId = input.required<number>();

	taskDeleted = output<void>();
	taskCommentsEdited = output<void>();

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
