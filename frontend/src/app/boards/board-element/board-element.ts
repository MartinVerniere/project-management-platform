import { Component, inject, input, output, signal } from "@angular/core";
import { RouterLink } from "@angular/router";
import { Board, BoardService } from "../../services/boards/board-service";
import { HttpErrorResponse } from "@angular/common/http";

@Component({
	selector: 'app-board-element',
	imports: [RouterLink],
	templateUrl: './board-element.html',
	styleUrl: './board-element.css',
})
export class BoardElement {
	boardService = inject(BoardService);

	board = input.required<Board>();
	projectId = input.required<number>();
	boardDeleted = output<void>();

	error = signal<string | null>(null);

	onDeleteBoard(boardId: number) {
		this.boardService.deleteBoard(boardId).subscribe({
			next: () => {
				this.boardDeleted.emit();
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
