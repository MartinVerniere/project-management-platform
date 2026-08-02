import { Component, computed, inject, input, output, resource, signal } from '@angular/core';
import { Task, TaskService } from '../../services/tasks/task-service';
import { HttpErrorResponse } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { CommentList } from '../../comments/comment-list/comment-list';
import { ProjectService } from '../../services/projects/project-service';
import { firstValueFrom } from 'rxjs';

@Component({
	selector: 'app-task-element',
	imports: [RouterLink, CommentList],
	templateUrl: './task-element.html',
	styleUrl: './task-element.css',
})
export class TaskElement {
	taskService = inject(TaskService);
	projectService = inject(ProjectService);

	task = input.required<Task>();
	projectId = input.required<number>();
	boardId = input.required<number>();
	columnId = input.required<number>();

	taskDeleted = output<void>();
	taskCommentsEdited = output<void>();
	taskAssigneeEdited = output<void>();

	members = resource({ loader: () => firstValueFrom(this.projectService.getMembers(this.projectId())) });
	memberList = computed(() => { return this.members.value() ?? [] });

	selectedAssigneeId = signal<number | null>(null);
	assigneeFormEnabled = signal<boolean>(false);
	error = signal<string | null>(null);

	onEnableSetAssignee() { this.assigneeFormEnabled.set(true); }
	onAssigneeChanged(event: Event) {
		const target = event.target as HTMLSelectElement;
		const value = target.value;

		this.selectedAssigneeId.set(value === 'null' ? null : parseInt(value));
	}
	onCancelSetAssignee() { 
		this.selectedAssigneeId.set(null);
		this.assigneeFormEnabled.set(false); 
	}

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

	onSetAssignee() {
		if (this.selectedAssigneeId() === null) {
			this.taskService.unassignTask(this.task().id).subscribe({
				next: () => {
					this.selectedAssigneeId.set(null);
					this.assigneeFormEnabled.set(false);
					this.error.set(null);
					this.taskAssigneeEdited.emit();
				},
				error: (response: HttpErrorResponse) => {
					const errorObject = response.error.error;
					console.log(errorObject);
					this.error.set(errorObject.message);
				}
			});
		} else {
			this.taskService.assignTask(this.task().id, this.selectedAssigneeId()!).subscribe({
				next: () => {
					this.selectedAssigneeId.set(null);
					this.assigneeFormEnabled.set(false);
					this.error.set(null);
					this.taskAssigneeEdited.emit();
				},
				error: (response: HttpErrorResponse) => {
					const errorObject = response.error.error;
					console.log(errorObject);
					this.error.set(errorObject.message);
				}
			});
		}
	}
}
