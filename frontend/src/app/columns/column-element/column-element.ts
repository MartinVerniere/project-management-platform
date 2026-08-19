import { HttpErrorResponse } from "@angular/common/http";
import { Component, inject, input, output, signal } from "@angular/core";
import { RouterLink, Router } from "@angular/router";
import { TaskList } from "../../tasks/task-list/task-list";
import { ColumnService } from "../../services/columns/column-service";
import { CdkDragHandle } from "@angular/cdk/drag-drop";
import { ProjectMemberDto } from "../../../../../shared/models/project";
import { ColumnDetailsDto } from "../../../../../shared/models/column";

@Component({
	selector: 'app-column-element',
	imports: [RouterLink, TaskList, CdkDragHandle],
	templateUrl: './column-element.html',
	styleUrl: './column-element.css',
})
export class ColumnElement {
	router = inject(Router);
	columnService = inject(ColumnService);

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
			},
			error: (response: HttpErrorResponse) => {
				const errorObject = response.error.error;
				console.log(errorObject);
				this.error.set(errorObject.message);
			}
		});
	}
}
