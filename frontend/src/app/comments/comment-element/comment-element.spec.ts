import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CommentElement } from './comment-element';
import { Component, input, output } from '@angular/core';
import { CommentUpdateForm } from '../comment-update-form/comment-update-form';
import { By } from '@angular/platform-browser';
import { of } from 'rxjs';
import { CommentService } from '../../services/comments/comment-service';
import { AuthService } from '../../services/auth/auth-service';
import type { CommentDto } from '@shared/models/comment';
import type { UserDto } from '@shared/models/user';

@Component({
	selector: 'app-comment-update-form',
	standalone: true,
	template: '',
})
class CommentUpdateFormStub {
	comment = input.required<CommentDto>();

	commentEdited = output<void>();
	canceledCommentEdit = output<void>();
}

describe('CommentElement', () => {
	let fixture: ComponentFixture<CommentElement>;
	let component: CommentElement;
	let html: HTMLElement;

	let commentServiceMock = { deleteComment: vi.fn() };
	let authServiceMock = { user: vi.fn() };

	const me: UserDto = {
		id: 1,
		username: 'john',
		email: 'john@test.com',
		avatarUrl: '/images/default-avatar.png'
	}

	const comment: CommentDto = {
		id: 1,
		content: 'Good',
		author: me,
		taskId: 1
	};

	async function createComponent(shouldAwait = true, hasAdminPermissions = true) {
		fixture = TestBed.createComponent(CommentElement);
		component = fixture.componentInstance;
		html = fixture.nativeElement;

		fixture.componentRef.setInput('comment', comment);
		fixture.componentRef.setInput('hasAdminPermissions', hasAdminPermissions);

		fixture.detectChanges();

		if (shouldAwait) {
			await fixture.whenStable();
			fixture.detectChanges();
		}
	};

	beforeEach(async () => {
		vi.clearAllMocks();

		await TestBed.configureTestingModule({
			imports: [CommentElement],
			providers: [
				{ provide: CommentService, useValue: commentServiceMock },
				{ provide: AuthService, useValue: authServiceMock },
			]
		}).overrideComponent(CommentElement, {
			remove: { imports: [CommentUpdateForm] },
			add: { imports: [CommentUpdateFormStub] }
		}).compileComponents();
	});

	it('should create', async () => {
		await createComponent();

		expect(component).toBeTruthy();
	});

	it('should render comment information', async () => {
		await createComponent();

		expect(html.textContent).toContain('Good');
	});

	it('should not render "Edit" nor "Delete" buttons when user doesnt have comment editor permissions', async () => {
		authServiceMock.user.mockReturnValue(of({
			id: 2,
			username: 'alice',
			email: 'alice@test.com',
			avatarUrl: '/images/default-avatar.png'
		}));

		await createComponent(true, false);

		const editButton = Array
			.from(html.querySelectorAll('button'))
			.find(button => button.textContent?.includes('Edit'));

		const deleteButton = Array
			.from(html.querySelectorAll('button'))
			.find(button => button.textContent?.includes('Delete'));

		expect(editButton).toBeUndefined();
		expect(deleteButton).toBeUndefined();
	});

	it('should emit commentEdited when CommentUpdateForm emits commentEdited, and hide the form', async () => {
		authServiceMock.user.mockReturnValue(of({ me }));

		await createComponent();

		component.onEnableEditComment();

		fixture.detectChanges();

		const child = fixture.debugElement
			.query(By.directive(CommentUpdateFormStub))
			.componentInstance as CommentUpdateFormStub;

		const emitSpy = vi.spyOn(component.commentEdited, 'emit');

		child.commentEdited.emit();

		expect(emitSpy).toHaveBeenCalled();
		expect(component.editCommentFormEnabled()).toBe(false);
	});

	it('should remove comment and emit commentDeleted when "Delete" button is clicked', async () => {
		commentServiceMock.deleteComment.mockReturnValue(of({}));
		authServiceMock.user.mockReturnValue(of({ me }));

		await createComponent();

		const emitSpy = vi.spyOn(component.commentDeleted, 'emit');

		const deleteButton = Array
			.from(html.querySelectorAll('button'))
			.find(button => button.textContent?.includes('Delete'));

		expect(deleteButton).toBeTruthy();

		deleteButton!.click();

		await fixture.whenStable();

		expect(commentServiceMock.deleteComment).toHaveBeenCalledWith(1);
		expect(emitSpy).toHaveBeenCalled();
	});

	it('should hide comment update form when CommentUpdateForm emits canceledCommentEdit', async () => {
		authServiceMock.user.mockReturnValue(of({ me }));

		await createComponent();

		component.onEnableEditComment();

		fixture.detectChanges();

		const child = fixture.debugElement
			.query(By.directive(CommentUpdateFormStub))
			.componentInstance as CommentUpdateFormStub;

		child.canceledCommentEdit.emit();

		expect(component.editCommentFormEnabled()).toBe(false);
	});
});
