import { Component, inject, input, output, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Task, TaskService } from '../../services/tasks/task-service';
import { TaskElement } from '../task-element/task-element';
import { ColumnService } from '../../services/columns/column-service';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
	selector: 'app-task-list',
	imports: [TaskElement, RouterLink],
	templateUrl: './task-list.html',
	styleUrl: './task-list.css',
})
export class TaskList {
	columnService = inject(ColumnService);

	taskList = input.required<Task[]>();
	projectId = input.required<number>();
	boardId = input.required<number>();
	columnId = input.required<number>();

	taskMoved = output<void>();
	taskDeleted = output<void>();

	error = signal<string | null>(null);

	onMoveUp(taskId: number) {
		const tasks = [... this.taskList()];

		const index = tasks.findIndex(task => task.id === taskId);
		if (index <= 0) return;

		[tasks[index], tasks[index - 1]] = [tasks[index - 1], tasks[index]]; //Swap tasks position

		const reorderedTasks = tasks.map((task, index) => ({ id: task.id, order: index }));

		this.columnService.changeTaskOrder(this.columnId(), { taskOrder: reorderedTasks }).subscribe({
			next: () => {
				this.taskMoved.emit();
				this.error.set(null);
			},
			error: (response: HttpErrorResponse) => {
				const errorObject = response.error.error;
				console.log(errorObject);
				this.error.set(errorObject.message);
			}
		});
	}

	onMoveDown(taskId: number) {
		const tasks = [... this.taskList()];

		const index = tasks.findIndex(task => task.id === taskId);
		if (index >= tasks.length - 1) return;

		[tasks[index], tasks[index + 1]] = [tasks[index + 1], tasks[index]]; //Swap tasks position

		const reorderedTasks = tasks.map((task, index) => ({ id: task.id, order: index }));

		this.columnService.changeTaskOrder(this.columnId(), { taskOrder: reorderedTasks }).subscribe({
			next: () => {
				this.taskMoved.emit();
				this.error.set(null);
			},
			error: (response: HttpErrorResponse) => {
				const errorObject = response.error.error;
				console.log(errorObject);
				this.error.set(errorObject.message);
			}
		});
	}

	onRemoveTask() {
		this.taskDeleted.emit();
	}
}
