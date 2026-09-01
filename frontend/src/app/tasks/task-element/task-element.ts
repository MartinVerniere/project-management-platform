import { Component, inject, input, output, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { CommentList } from '../../comments/comment-list/comment-list';
import { TaskService } from '../../services/tasks/task-service';
import { CdkDragHandle } from '@angular/cdk/drag-drop';
import type { TaskDetailsDto } from '@shared/models/task';
import type { ProjectMemberDto } from '@shared/models/project';
import { ToastService } from '../../services/toast/toast-service';

@Component({
	selector: 'app-task-element',
	imports: [RouterLink, CommentList, CdkDragHandle],
	templateUrl: './task-element.html',
	styleUrl: './task-element.css',
})
export class TaskElement {
	taskService = inject(TaskService);
	toastService = inject(ToastService);

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
				this.toastService.success('Task deleted successfully.');
			},
			error: (response: HttpErrorResponse) => {
				const errorObject = response.error.error;
				console.log(errorObject);
				this.error.set(errorObject.message);
				this.toastService.error('Failed to delete task.');
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
					this.toastService.success('Task unassigned successfully.');
				},
				error: (response: HttpErrorResponse) => {
					const errorObject = response.error.error;
					console.log(errorObject);
					this.error.set(errorObject.message);
					this.toastService.error('Failed to unassign task.');
				}
			});
		} else {
			this.taskService.assignTask(this.task().id, this.selectedAssigneeId()!).subscribe({
				next: () => {
					this.selectedAssigneeId.set(null);
					this.assigneeFormEnabled.set(false);
					this.error.set(null);
					this.taskAssigneeEdited.emit();
					this.toastService.success('Task assigned successfully.');
				},
				error: (response: HttpErrorResponse) => {
					const errorObject = response.error.error;
					console.log(errorObject);
					this.error.set(errorObject.message);
					this.toastService.error('Failed to assign task.');
				}
			});
		}
	}
}
