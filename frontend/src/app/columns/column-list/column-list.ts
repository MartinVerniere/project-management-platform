import { Component, inject, input, output, signal } from "@angular/core";
import { RouterLink, ActivatedRoute } from "@angular/router";
import { Column } from "../../services/columns/column-service";
import { ColumnElement } from "../column-element/column-element";
import { BoardService } from "../../services/boards/board-service";
import { HttpErrorResponse } from "@angular/common/http";
import { TaskService } from "../../services/tasks/task-service";

@Component({
	selector: 'app-column-list',
	imports: [RouterLink, ColumnElement],
	templateUrl: './column-list.html',
	styleUrl: './column-list.css',
})
export class ColumnList {
	route = inject(ActivatedRoute);
	boardService = inject(BoardService);
	taskService = inject(TaskService);

	columnList = input.required<Column[]>();
	projectId = input.required<number>();
	boardId = input.required<number>();

	columnListEdited = output<void>();

	error = signal<string | null>(null);

	onMoveLeft(columnId: number) {
		const columns = [...this.columnList()];

		const index = columns.findIndex(c => c.id === columnId);
		if (index <= 0) return;

		[columns[index], columns[index - 1]] = [columns[index - 1], columns[index]]; //Swap columns position

		const reorderedColumns = columns.map((column, index) => ({ id: column.id, order: index }));

		this.boardService.changeColumnOrder(this.boardId(), { columnOrder: reorderedColumns }).subscribe({
			next: () => {
				this.columnListEdited.emit();
				this.error.set(null);
			},
			error: (response: HttpErrorResponse) => {
				const errorObject = response.error.error;
				console.log(errorObject);
				this.error.set(errorObject.message);
			}
		});
	}

	onMoveRight(columnId: number) {
		const columns = [...this.columnList()];

		const index = columns.findIndex(c => c.id === columnId);
		if (index >= columns.length - 1) return;

		[columns[index], columns[index + 1]] = [columns[index + 1], columns[index]]; //Swap columns position

		const reorderedColumns = columns.map((column, index) => ({ id: column.id, order: index }));

		this.boardService.changeColumnOrder(this.boardId(), { columnOrder: reorderedColumns }).subscribe({
			next: () => {
				this.columnListEdited.emit();
				this.error.set(null);
			},
			error: (response: HttpErrorResponse) => {
				const errorObject = response.error.error;
				console.log(errorObject);
				this.error.set(errorObject.message);
			}
		});
	}

	onMoveTaskToColumn(columnId: number, event: { taskId: number; direction: 'left' | 'right' }) {
		const columns = this.columnList();

		const currentIndex = columns.findIndex(column => column.id === columnId);
		if (currentIndex === -1) return;

		const destinationIndex = event.direction === 'left'
			? currentIndex - 1
			: currentIndex + 1;

		if (destinationIndex < 0 || destinationIndex >= columns.length) return;

		const destinationColumn = columns[destinationIndex];

		this.taskService.moveTask(event.taskId, destinationColumn.id).subscribe({
			next: () => {
				this.columnListEdited.emit();
				this.error.set(null);
			},
			error: (response: HttpErrorResponse) => {
				const errorObject = response.error.error;
				this.error.set(errorObject.message);
			}
		});
	}
}
