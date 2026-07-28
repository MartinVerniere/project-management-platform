import { Component, inject, input, output, signal } from '@angular/core';
import { TaskService } from '../../services/tasks/task-service';
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
	taskService = inject(TaskService);

	commentList = input.required<Comment[]>();
	projectId = input.required<number>();
	boardId = input.required<number>();
	columnId = input.required<number>();
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

	onCommentRemoved() {
		this.commentListEdited.emit();
	}
}
