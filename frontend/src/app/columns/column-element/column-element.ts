import { HttpErrorResponse } from "@angular/common/http";
import { Component, inject, input, output, signal } from "@angular/core";
import { RouterLink, Router } from "@angular/router";
import { ColumnService, Column } from "../../services/columns/column-service";
import { TaskList } from "../../tasks/task-list/task-list";

@Component({
	selector: 'app-column-element',
	imports: [RouterLink, TaskList],
	templateUrl: './column-element.html',
	styleUrl: './column-element.css',
})
export class ColumnElement {
	router = inject(Router);
	columnService = inject(ColumnService);

	column = input.required<Column>();
	projectId = input.required<number>();
	boardId = input.required<number>();

	isFirst = input<boolean>();
	isLast = input<boolean>();

	columnElementEdited = output<void>();
	moveLeft = output<number>();
	moveRight = output<number>();
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
