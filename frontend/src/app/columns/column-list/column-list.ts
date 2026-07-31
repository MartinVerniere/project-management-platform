import { Component, inject, input, output, signal } from "@angular/core";
import { RouterLink, ActivatedRoute } from "@angular/router";
import { Column } from "../../services/columns/column-service";
import { ColumnElement } from "../column-element/column-element";
import { BoardService } from "../../services/boards/board-service";
import { HttpErrorResponse } from "@angular/common/http";
import { TaskService } from "../../services/tasks/task-service";
import { CdkDrag, CdkDragDrop, CdkDropList, CdkDropListGroup, moveItemInArray } from "@angular/cdk/drag-drop";

@Component({
	selector: 'app-column-list',
	imports: [RouterLink, ColumnElement, CdkDrag, CdkDropList, CdkDropListGroup],
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

	onMoveColumn(event: CdkDragDrop<Column[]>) {
		// Case 1: Didnt move column
		if (event.previousIndex === event.currentIndex) return;

		// Case 2: Moved column inside current column list
		const columns = [... this.columnList()];
		moveItemInArray(columns, event.previousIndex, event.currentIndex);

		const newColumnOrder = columns.map((column, index) => ({ id: column.id, order: index }));

		this.boardService.changeColumnOrder(this.boardId(), { columnOrder: newColumnOrder }).subscribe({
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

	onMoveTaskToColumn(event: { taskId: number; destinationColumnId: number; }) {
		const { taskId, destinationColumnId } = event;
		this.taskService.moveTask(taskId, destinationColumnId).subscribe({
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

	onlyColumnsPredicate = (drag: CdkDrag) => {
		return drag.data?.type === 'column';
	};
}
