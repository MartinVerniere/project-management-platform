import { Component, inject, input, output, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { CommentList } from '../../comments/comment-list/comment-list';
import { TaskService } from '../../services/tasks/task-service';
import { CdkDragHandle } from '@angular/cdk/drag-drop';
import { ProjectMemberDto } from '../../../../../shared/models/project';
import { TaskDetailsDto } from '../../../../../shared/models/task';

@Component({
	selector: 'app-task-element',
	imports: [RouterLink, CommentList, CdkDragHandle],
	templateUrl: './task-element.html',
	styleUrl: './task-element.css',
})
export class TaskElement {
	taskService = inject(TaskService);

	task = input.required<TaskDetailsDto>();
	projectId = input.required<number>();
	boardId = input.required<number>();
	columnId = input.required<number>();
	memberList = input.required<ProjectMemberDto[]>();
	hasAdminPermissions = input.required<boolean>();

	taskDeleted = output<void>();
	taskCommentsEdited = output<void>();
	taskAssigneeEdited = output<void>();

	avatarPreview = signal('/images/default-avatar.png');
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
