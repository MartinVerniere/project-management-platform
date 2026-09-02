import { HttpErrorResponse } from "@angular/common/http";
import { Component, inject, resource, signal, effect } from "@angular/core";
import { FormField, form, required, submit } from "@angular/forms/signals";
import { Router, ActivatedRoute } from "@angular/router";
import { firstValueFrom } from "rxjs";
import { BoardService } from "../../services/boards/board-service";
import { BoardModel } from "../board-form/board-form";
import { ToastService } from "../../services/toast/toast-service";

@Component({
	selector: 'app-board-update-form',
	imports: [FormField],
	templateUrl: './board-update-form.html',
	styleUrl: './board-update-form.css',
})
export class BoardUpdateForm {
	router = inject(Router);
	boardService = inject(BoardService);
	toastService = inject(ToastService);
	route = inject(ActivatedRoute);

	projectId = Number(this.route.snapshot.paramMap.get('projectId'));
	boardId = Number(this.route.snapshot.paramMap.get('boardId'));

	currentBoard = resource({ loader: () => firstValueFrom(this.boardService.getBoard(this.boardId)) });

	boardModel = signal<BoardModel>({ name: '' });

	boardForm = form(this.boardModel, (fieldPath) => {
		required(fieldPath.name, { message: 'name is required' });
	});

	error = signal<string | null>(null);

	constructor() {
		effect(() => {
			const board = this.currentBoard.value();
			if (!board) return;

			this.boardModel.set({ name: board.name });
		});
	}

	async onSubmit(event: Event) {
		event.preventDefault();

		submit(this.boardForm, async () => {
			const value = this.boardForm().value();

			this.boardService.updateBoard(this.boardId, value).subscribe({
				next: () => {
					this.resetForm();
					this.error.set(null);
					this.toastService.success('Updated board successfully.');
					this.router.navigate(['/projects', this.projectId]);
				},
				error: (response: HttpErrorResponse) => {
					const errorObject = response.error.error;
					console.log(errorObject);
					this.error.set(errorObject.message);
					this.toastService.error('Failed to update board.');
				}
			});
		});
	}

	onCancel() {
		this.router.navigate(['/projects', this.projectId]);
	}

	resetForm() {
		this.boardModel.set({ name: '' });
		this.boardForm().reset();
	}
}
