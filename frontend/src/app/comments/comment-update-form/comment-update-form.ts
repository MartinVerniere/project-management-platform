import { Component, effect, inject, input, output, signal } from '@angular/core';
import { Comment, CommentService } from '../../services/comments/comment-service';
import { CommentModel } from '../comment-form/comment-form';
import { form, FormField, required, submit } from '@angular/forms/signals';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
	selector: 'app-comment-update-form',
	imports: [FormField],
	templateUrl: './comment-update-form.html',
	styleUrl: './comment-update-form.css',
})
export class CommentUpdateForm {
	commentService = inject(CommentService);

	comment = input.required<Comment>();

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

			this.commentModel.set({
				content: comment.content,
			});
		});
	}

	async onSubmit(event: Event) {
		event.preventDefault();

		submit(this.commentForm, async () => {
			this.commentService.updateComment(this.comment().id, this.commentModel()).subscribe({
				next: () => {
					this.error.set(null);
					this.commentEdited.emit();
				},
				error: (response: HttpErrorResponse) => {
					const errorObject = response.error.error;
					console.log(errorObject);
					this.error.set(errorObject.message);
				}
			});

		});
	}

	onCancel() { this.canceledCommentEdit.emit(); }
}
