import { Component, computed, inject, input, output, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { CommentService } from '../../services/comments/comment-service';
import { CommentUpdateForm } from '../comment-update-form/comment-update-form';
import { AuthService } from '../../services/auth/auth-service';
import type { CommentDto } from '@shared/models/comment';
import { ToastService } from '../../services/toast/toast-service';

@Component({
	selector: 'app-comment-element',
	imports: [CommentUpdateForm],
	templateUrl: './comment-element.html',
	styleUrl: './comment-element.css',
})
export class CommentElement {
	commentService = inject(CommentService);
	authService = inject(AuthService);
	toastService = inject(ToastService);

	comment = input.required<CommentDto>();
	hasAdminPermissions = input.required<boolean>();

	hasCommentEditorPermissions = computed(() => {
		const userId = this.authService.user()?.id;
		return this.hasAdminPermissions() || this.comment().author.id === userId;
	});

	commentEdited = output<void>();
	commentDeleted = output<void>();

	avatarPreview = signal('/images/default-avatar.png');
	editCommentFormEnabled = signal<boolean>(false);
	error = signal<string | null>(null);

	onCommentDeleted(commentId: number) {
		this.commentService.deleteComment(commentId).subscribe({
			next: () => {
				this.commentDeleted.emit();
				this.error.set(null);
				this.toastService.success('Comment deleted successfully.');
			},
			error: (response: HttpErrorResponse) => {
				const errorObject = response.error.error;
				console.log(errorObject);
				this.error.set(errorObject.message);
				this.toastService.error('Failed to delete comment.');
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
