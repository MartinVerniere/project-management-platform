import { Component, inject, input, output, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Comment, CommentService } from '../../services/comments/comment-service';
import { CommentUpdateForm } from '../comment-update-form/comment-update-form';

@Component({
	selector: 'app-comment-element',
	imports: [CommentUpdateForm],
	templateUrl: './comment-element.html',
	styleUrl: './comment-element.css',
})
export class CommentElement {
	commentService = inject(CommentService);

	comment = input.required<Comment>();

	projectId = input.required<number>();
	boardId = input.required<number>();
	columnId = input.required<number>();
	taskId = input.required<number>();

	commentEdited = output<void>();
	commentDeleted = output<void>();

	editCommentFormEnabled = signal<boolean>(false);
	error = signal<string | null>(null);

	onCommentDeleted(commentId: number) {
		this.commentService.deleteComment(commentId).subscribe({
			next: () => {
				this.commentDeleted.emit();
				this.error.set(null);
			},
			error: (response: HttpErrorResponse) => {
				const errorObject = response.error.error;
				console.log(errorObject);
				this.error.set(errorObject.message);
			}
		});
	}

	onEnableEditComment() { this.editCommentFormEnabled.set(true); }
	onCancelEditComment() { this.editCommentFormEnabled.set(false); }

	onCommentEdited() {
		this.editCommentFormEnabled.set(false);
		this.commentEdited.emit();
	}

	onCommentRemoved() {
		this.commentEdited.emit();
	}
}
