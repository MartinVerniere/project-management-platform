import { Component, inject, input, output, signal } from '@angular/core';
import { TaskService } from '../../services/tasks/task-service';
import { form, FormField, required, submit } from '@angular/forms/signals';
import { HttpErrorResponse } from '@angular/common/http';
import { ToastService } from '../../services/toast/toast-service';

export interface CommentModel {
	content: string;
}

@Component({
	selector: 'app-comment-form',
	imports: [FormField],
	templateUrl: './comment-form.html',
	styleUrl: './comment-form.css',
})
export class CommentForm {
	taskService = inject(TaskService);
	toastService = inject(ToastService);
	
	taskId = input.required<number>();

	commentAdded = output<void>();
	canceledCommentAdd = output<void>();

	commentModel = signal<CommentModel>({
		content: ''
	});

	error = signal<string | null>(null);

	commentForm = form(this.commentModel, (fieldPath) => {
		required(fieldPath.content, { message: 'Content is required' });
	});

	async onSubmit(event: Event) {
		event.preventDefault();

		submit(this.commentForm, async () => {
			if (this.commentModel().content === '') return;

			this.taskService.addComment(this.taskId(), this.commentModel()).subscribe({
				next: () => {
					this.resetForm();
					this.error.set(null);
					this.toastService.success('Added comment successfully.');
					this.commentAdded.emit();
				},
				error: (response: HttpErrorResponse) => {
					const errorObject = response.error.error;
					console.log(errorObject);
					this.error.set(errorObject.message);
					this.toastService.error('Failed to add comment.');
				}
			});

		});
	}

	onCancel() { this.canceledCommentAdd.emit(); }

	resetForm() {
		this.commentModel.set({ content: '' });
		this.commentForm().reset();
	}
}
