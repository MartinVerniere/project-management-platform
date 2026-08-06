import { Component, input, output, signal } from '@angular/core';
import { CommentElement } from '../comment-element/comment-element';
import { CommentForm } from '../comment-form/comment-form';
import { CommentResponse } from '../../models/comment';

@Component({
	selector: 'app-comment-list',
	imports: [CommentElement, CommentForm],
	templateUrl: './comment-list.html',
	styleUrl: './comment-list.css',
})
export class CommentList {
	commentList = input.required<CommentResponse[]>();
	taskId = input.required<number>();

	commentListEdited = output<void>();

	addCommentFormEnabled = signal<boolean>(false);

	onEnableAddComment() { this.addCommentFormEnabled.set(true); }
	onCancelAddComment() { this.addCommentFormEnabled.set(false); }

	onCommentAdded() {
		this.addCommentFormEnabled.set(false);
		this.commentListEdited.emit();
	}
}
