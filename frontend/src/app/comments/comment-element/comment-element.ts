import { Component, inject, input, output, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { Comment, CommentService } from '../../services/comments/comment-service';

@Component({
	selector: 'app-comment-element',
	imports: [RouterLink],
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

	commentDeleted = output<void>();

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
}
