import { HttpErrorResponse } from "@angular/common/http";
import { Component, inject, signal } from "@angular/core";
import { FormField, form, required, submit } from "@angular/forms/signals";
import { Router, ActivatedRoute } from "@angular/router";
import { ProjectService } from "../../services/projects/project-service";
import { ToastService } from "../../services/toast/toast-service";

export interface BoardModel {
	name: string;
}

@Component({
	selector: 'app-board-form',
	imports: [FormField],
	templateUrl: './board-form.html',
	styleUrl: './board-form.css',
})
export class BoardForm {
	router = inject(Router);
	projectService = inject(ProjectService);
	toastService = inject(ToastService);
	route = inject(ActivatedRoute);

	projectId = Number(this.route.snapshot.paramMap.get('id'));

	boardModel = signal<BoardModel>({
		name: ''
	});
	error = signal<string | null>(null);

	boardForm = form(this.boardModel, (fieldPath) => {
		required(fieldPath.name, { message: 'name is required' });
	});

	async onSubmit(event: Event) {
		event.preventDefault();

		submit(this.boardForm, async () => {
			if (this.boardModel().name === '') return;

			this.projectService.createBoard(this.projectId, this.boardModel()).subscribe({
				next: () => {
					this.resetForm();
					this.error.set(null);
					this.toastService.success('Created board successfully.');
					this.router.navigate(['/projects', this.projectId]);
				},
				error: (response: HttpErrorResponse) => {
					const errorObject = response.error.error;
					console.log(errorObject);
					this.error.set(errorObject.message);
					this.toastService.error('Failed to create board.');
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
