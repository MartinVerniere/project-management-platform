import { Component, inject, signal } from '@angular/core';
import { BoardService } from '../../services/boards/board-service';
import { HttpErrorResponse } from '@angular/common/http';
import { form, FormField, required, submit } from '@angular/forms/signals';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ToastService } from '../../services/toast/toast-service';

export interface ColumnModel {
	name: string;
}

@Component({
	selector: 'app-column-form',
	imports: [FormField, RouterLink],
	templateUrl: './column-form.html',
	styleUrl: './column-form.css',
})
export class ColumnForm {
	router = inject(Router);
	boardService = inject(BoardService);
	toastService = inject(ToastService);
	route = inject(ActivatedRoute);

	projectId = Number(this.route.snapshot.paramMap.get('projectId'));
	boardId = Number(this.route.snapshot.paramMap.get('boardId'));

	columnModel = signal<ColumnModel>({
		name: '',
	});
	error = signal<string | null>(null);

	columnForm = form(this.columnModel, (fieldPath) => {
		required(fieldPath.name, { message: 'Name is required' });
	});

	async onSubmit(event: Event) {
		event.preventDefault();

		submit(this.columnForm, async () => {
			this.boardService.createColumn(this.boardId, this.columnModel()).subscribe({
				next: () => {
					this.resetForm();
					this.error.set(null);
					this.toastService.success('Created column successfully.');
					this.router.navigate(['/projects', this.projectId, 'boards', this.boardId]);
				},
				error: (response: HttpErrorResponse) => {
					const errorObject = response.error.error;
					console.log(errorObject);
					this.error.set(errorObject.message);
					this.toastService.error('Failed to create column.');
				}
			});

		});
	}

	resetForm() {
		this.columnModel.set({
			name: '',
		});
		this.columnForm().reset();
	}
}
