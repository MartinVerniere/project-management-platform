import { Component, computed, inject, input, output, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { CommentService } from '../../services/comments/comment-service';
import { CommentUpdateForm } from '../comment-update-form/comment-update-form';
import { AuthService } from '../../services/auth/auth-service';
import { CommentDto } from '@shared/models/comment';

@Component({
	selector: 'app-comment-element',
	imports: [CommentUpdateForm],
	templateUrl: './comment-element.html',
	styleUrl: './comment-element.css',
})
export class CommentElement {
	commentService = inject(CommentService);
	authService = inject(AuthService);

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
