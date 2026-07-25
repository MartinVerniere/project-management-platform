import { Component, inject, input, output, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Task, TaskService } from '../../services/tasks/task-service';
import { TaskElement } from '../task-element/task-element';

@Component({
	selector: 'app-task-list',
	imports: [TaskElement, RouterLink],
	templateUrl: './task-list.html',
	styleUrl: './task-list.css',
})
export class TaskList {
	route = inject(ActivatedRoute);
	boardService = inject(TaskService);

	projectId = Number(this.route.snapshot.paramMap.get('projectId'));
	boardId = Number(this.route.snapshot.paramMap.get('boardId'));
	columnId = Number(this.route.snapshot.paramMap.get('columnId'));

	taskList = input.required<Task[]>();

	taskMoved = output<void>();
	taskDeleted = output<void>();

	error = signal<string | null>(null);

	onMoveUp(taskId: number) { }

	onMoveDown(taskId: number) { }

	onRemoveTask() {
		this.taskDeleted.emit();
	}
}
