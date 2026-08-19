import { Component, inject, input, output, signal } from '@angular/core';
import { TaskElement } from '../task-element/task-element';
import { ColumnService } from '../../services/columns/column-service';
import { HttpErrorResponse } from '@angular/common/http';
import { CdkDrag, CdkDragDrop, CdkDragPlaceholder, CdkDropList, moveItemInArray } from '@angular/cdk/drag-drop';
import { ProjectMemberDto } from '../../../../../shared/models/project';
import { TaskDetailsDto } from '../../../../../shared/models/task';

@Component({
	selector: 'app-task-list',
	imports: [TaskElement, CdkDrag, CdkDropList, CdkDragPlaceholder],
	templateUrl: './task-list.html',
	styleUrl: './task-list.css',
})
export class TaskList {
	columnService = inject(ColumnService);

	taskList = input.required<TaskDetailsDto[]>();
	projectId = input.required<number>();
	boardId = input.required<number>();
	columnId = input.required<number>();
	memberList = input.required<ProjectMemberDto[]>();
	filtersActive = input.required<boolean>();
	hasAdminPermissions = input.required<boolean>();

	taskListEdited = output<void>();
	moveTaskToColumn = output<number>();

	error = signal<string | null>(null);

	onMoveTask(event: CdkDragDrop<TaskDetailsDto[]>) {
		if (this.filtersActive()) return;

		const task = event.item.data.task as TaskDetailsDto;

		// Case 1: Moved to different column
		if (event.previousContainer !== event.container) {
			this.moveTaskToColumn.emit(task.id);
			return;
		}

		// Case 2: Didnt move task
		if (event.previousIndex === event.currentIndex) return;

		// Case 3: Moved task inside current task list
		const tasks = [... this.taskList()];
		moveItemInArray(tasks, event.previousIndex, event.currentIndex);

		const newTaskOrder = tasks.map((task, index) => ({ id: task.id, order: index }));

		this.columnService.changeTaskOrder(this.columnId(), { taskOrder: newTaskOrder }).subscribe({
			next: () => {
				this.taskListEdited.emit();
				this.error.set(null);
			},
			error: (response: HttpErrorResponse) => {
				const errorObject = response.error.error;
				console.log(errorObject);
				this.error.set(errorObject.message);
			}
		});
	};

	enabledDragAndDropPredicate = (drag: CdkDrag) => {
		return drag.data?.type === 'task' && !this.filtersActive();
	};
}
