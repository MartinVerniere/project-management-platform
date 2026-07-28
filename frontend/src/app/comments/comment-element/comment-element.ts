import { Component, input, output, signal } from '@angular/core';
import { Comment } from '../../services/tasks/task-service';
import { HttpErrorResponse } from '@angular/common/http';
import { RouterLink } from '@angular/router';

@Component({
	selector: 'app-comment-element',
	imports: [RouterLink],
	templateUrl: './comment-element.html',
	styleUrl: './comment-element.css',
})
export class CommentElement {
	commentService = 'commentService';

	comment = input.required<Comment>();

	projectId = input.required<number>();
	boardId = input.required<number>();
	columnId = input.required<number>();
	taskId = input.required<number>();

	commentDeleted = output<void>();

	error = signal<string | null>(null);

	onCommentDeleted(commentId: number) {
		// this.commentService.deleteComment(commentId).subscribe({
		// 	next: () => {
		// 		this.commentDeleted.emit();
		// 		this.error.set(null);
		// 	},
		// 	error: (response: HttpErrorResponse) => {
		// 		const errorObject = response.error.error;
		// 		console.log(errorObject);
		// 		this.error.set(errorObject.message);
		// 	}
		// });
	}
}
