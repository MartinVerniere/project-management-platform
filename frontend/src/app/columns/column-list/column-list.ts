import { Component, computed, inject, input, output, signal } from "@angular/core";
import { ActivatedRoute } from "@angular/router";
import { ColumnElement } from "../column-element/column-element";
import { BoardService } from "../../services/boards/board-service";
import { HttpErrorResponse } from "@angular/common/http";
import { TaskService } from "../../services/tasks/task-service";
import { CdkDrag, CdkDragDrop, CdkDropList, CdkDropListGroup, moveItemInArray } from "@angular/cdk/drag-drop";
import { ProjectMemberDto } from "../../../../../shared/models/project";
import { ColumnDetailsDto } from "../../../../../shared/models/column";

@Component({
	selector: 'app-column-list',
	imports: [ColumnElement, CdkDrag, CdkDropList, CdkDropListGroup],
	templateUrl: './column-list.html',
	styleUrl: './column-list.css',
})
export class ColumnList {
	route = inject(ActivatedRoute);
	boardService = inject(BoardService);
	taskService = inject(TaskService);

	columnList = input.required<ColumnDetailsDto[]>();
	projectId = input.required<number>();
	boardId = input.required<number>();
	members = input.required<ProjectMemberDto[]>();
	hasAdminPermissions = input.required<boolean>();

	columnListEdited = output<void>();

	searchTerm = signal('');
	selectedAssigneeId = signal<number | null>(null);
	error = signal<string | null>(null);

	filtersActive = computed(() => this.searchTerm().trim() !== '' || this.selectedAssigneeId() !== null);

	filteredColumnList = computed(() => {
		const search = this.searchTerm().trim().toLowerCase();
		const assigneeId = this.selectedAssigneeId();

		return this.columnList().map(column => ({
			...column,
			tasks: column.tasks.filter(task => {
				const matchesSearch = task.title.toLowerCase().includes(search);
				const matchesAssignee = assigneeId === null
					? true
					: task.assignee?.id === assigneeId;

				return matchesSearch && matchesAssignee;
			})
		}));
	});

	onMoveColumn(event: CdkDragDrop<ColumnDetailsDto[]>) {
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

	onSearchChange(event: Event) {
		const input = event.target as HTMLInputElement;
		this.searchTerm.set(input.value);
	}

	onAssigneeChange(event: Event) {
		const select = event.target as HTMLSelectElement;
		this.selectedAssigneeId.set(select.value === '' ? null : Number(select.value));
	}

	clearFilters() {
		this.searchTerm.set('');
		this.selectedAssigneeId.set(null);
	}
}
