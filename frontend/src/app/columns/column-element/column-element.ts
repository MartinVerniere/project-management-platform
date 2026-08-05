import { HttpErrorResponse } from "@angular/common/http";
import { Component, inject, input, output, signal } from "@angular/core";
import { RouterLink, Router } from "@angular/router";
import { TaskList } from "../../tasks/task-list/task-list";
import { ProjectMemberResponse } from "../../models/project";
import { ColumnService } from "../../services/columns/column-service";
import { ColumnResponse } from "../../models/column";

@Component({
	selector: 'app-column-element',
	imports: [RouterLink, TaskList],
	templateUrl: './column-element.html',
	styleUrl: './column-element.css',
})
export class ColumnElement {
	router = inject(Router);
	columnService = inject(ColumnService);

	column = input.required<ColumnResponse>();
	projectId = input.required<number>();
	boardId = input.required<number>();
	memberList = input.required<ProjectMemberResponse[]>();
	filtersActive = input.required<boolean>();

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
