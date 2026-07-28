import { Component, input, output, signal } from '@angular/core';
import { CommentElement } from '../comment-element/comment-element';
import { Comment } from '../../services/comments/comment-service';
import { CommentForm } from '../comment-form/comment-form';

@Component({
	selector: 'app-comment-list',
	imports: [CommentElement, CommentForm],
	templateUrl: './comment-list.html',
	styleUrl: './comment-list.css',
})
export class CommentList {
	commentList = input.required<Comment[]>();
	taskId = input.required<number>();

	commentListEdited = output<void>();

	addCommentFormEnabled = signal<boolean>(false);

	error = signal<string | null>(null);

	onEnableAddComment() { this.addCommentFormEnabled.set(true); }
	onCancelAddComment() { this.addCommentFormEnabled.set(false); }

	onCommentAdded() {
		this.addCommentFormEnabled.set(false);
		this.commentListEdited.emit();
	}
}
