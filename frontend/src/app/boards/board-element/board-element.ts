import { Component, inject, input, output, signal } from "@angular/core";
import { RouterLink } from "@angular/router";
import { HttpErrorResponse } from "@angular/common/http";
import { BoardService } from "../../services/boards/board-service";
import type { BoardDto } from "@shared/models/board";
import { ToastService } from "../../services/toast/toast-service";

@Component({
	selector: 'app-board-element',
	imports: [RouterLink],
	templateUrl: './board-element.html',
	styleUrl: './board-element.css',
})
export class BoardElement {
	boardService = inject(BoardService);
	toastService = inject(ToastService);

	board = input.required<BoardDto>();
	projectId = input.required<number>();
	hasAdminPermissions = input.required<boolean>();

	boardDeleted = output<void>();

	error = signal<string | null>(null);

	onDeleteBoard(boardId: number) {
		this.boardService.deleteBoard(boardId).subscribe({
			next: () => {
				this.boardDeleted.emit();
				this.error.set(null);
				this.toastService.success('Board deleted successfully.');
			},
			error: (response: HttpErrorResponse) => {
				const errorObject = response.error.error;
				console.log(errorObject);
				this.error.set(errorObject.message);
				this.toastService.error('Failed to delete board.');
			}
		});
	}
}
