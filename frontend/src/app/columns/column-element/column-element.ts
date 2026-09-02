import { HttpErrorResponse } from "@angular/common/http";
import { Component, inject, input, output, signal } from "@angular/core";
import { RouterLink } from "@angular/router";
import { TaskList } from "../../tasks/task-list/task-list";
import { ColumnService } from "../../services/columns/column-service";
import { CdkDragHandle } from "@angular/cdk/drag-drop";
import type { ColumnDetailsDto } from "@shared/models/column";
import type { ProjectMemberDto } from "@shared/models/project";
import { ToastService } from "../../services/toast/toast-service";

@Component({
	selector: 'app-column-element',
	imports: [RouterLink, TaskList, CdkDragHandle],
	templateUrl: './column-element.html',
	styleUrl: './column-element.css',
})
export class ColumnElement {
	columnService = inject(ColumnService);
	toastService = inject(ToastService);

	column = input.required<ColumnDetailsDto>();
	projectId = input.required<number>();
	boardId = input.required<number>();
	memberList = input.required<ProjectMemberDto[]>();
	filtersActive = input.required<boolean>();
	hasAdminPermissions = input.required<boolean>();

	isFirst = input<boolean>();
	isLast = input<boolean>();

	columnElementEdited = output<void>();
	moveTaskToColumn = output<{ taskId: number; destinationColumnId: number; }>();

	error = signal<string | null>(null);

	onRemoveColumn(columnId: number) {
		this.columnService.deleteColumn(columnId).subscribe({
			next: () => {
				this.columnElementEdited.emit();
				this.error.set(null);
				this.toastService.success('Column deleted successfully.');
			},
			error: (response: HttpErrorResponse) => {
				const errorObject = response.error.error;
				console.log(errorObject);
				this.error.set(errorObject.message);
				this.toastService.error('Failed to delete Column.');
			}
		});
	}
}
