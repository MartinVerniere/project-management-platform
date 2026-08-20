import { Component, input, output, signal } from '@angular/core';
import { CommentElement } from '../comment-element/comment-element';
import { CommentForm } from '../comment-form/comment-form';
import { CommentDto } from '@shared/models/comment';

@Component({
	selector: 'app-comment-list',
	imports: [CommentElement, CommentForm],
	templateUrl: './comment-list.html',
	styleUrl: './comment-list.css',
})
export class CommentList {
	commentList = input.required<CommentDto[]>();
	taskId = input.required<number>();
	hasAdminPermissions = input.required<boolean>();

	commentListEdited = output<void>();

	addCommentFormEnabled = signal<boolean>(false);

	onEnableAddComment() { this.addCommentFormEnabled.set(true); }
	onCancelAddComment() { this.addCommentFormEnabled.set(false); }

	onCommentAdded() {
		this.addCommentFormEnabled.set(false);
		this.commentListEdited.emit();
	}
}
