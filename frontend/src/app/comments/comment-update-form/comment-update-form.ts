import { Component, effect, inject, input, output, signal } from '@angular/core';
import { CommentService } from '../../services/comments/comment-service';
import { CommentModel } from '../comment-form/comment-form';
import { form, FormField, required, submit } from '@angular/forms/signals';
import { HttpErrorResponse } from '@angular/common/http';
import type { CommentDto } from '@shared/models/comment';
import { ToastService } from '../../services/toast/toast-service';

@Component({
	selector: 'app-comment-update-form',
	imports: [FormField],
	templateUrl: './comment-update-form.html',
	styleUrl: './comment-update-form.css',
})
export class CommentUpdateForm {
	commentService = inject(CommentService);
	toastService = inject(ToastService);

	comment = input.required<CommentDto>();

	commentEdited = output<void>();
	canceledCommentEdit = output<void>();

	commentModel = signal<CommentModel>({
		content: ''
	});

	error = signal<string | null>(null);

	commentForm = form(this.commentModel, (fieldPath) => {
		required(fieldPath.content, { message: 'Content is required' });
	});

	constructor() {
		effect(() => {
			const comment = this.comment();
			this.commentModel.set({ content: comment.content });
		});
	}

	async onSubmit(event: Event) {
		event.preventDefault();

		submit(this.commentForm, async () => {
			this.commentService.updateComment(this.comment().id, this.commentModel()).subscribe({
				next: () => {
					this.error.set(null);
					this.commentEdited.emit();
					this.toastService.success('Updated comment successfully.');
				},
				error: (response: HttpErrorResponse) => {
					const errorObject = response.error.error;
					console.log(errorObject);
					this.error.set(errorObject.message);
					this.toastService.error('Failed to update comment.');
				}
			});

		});
	}

	onCancel() { this.canceledCommentEdit.emit(); }
}
