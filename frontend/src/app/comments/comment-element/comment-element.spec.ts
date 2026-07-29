import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CommentElement } from './comment-element';
import { Component, input, output } from '@angular/core';
import { Comment, CommentService } from '../../services/comments/comment-service';
import { CommentUpdateForm } from '../comment-update-form/comment-update-form';
import { By } from '@angular/platform-browser';
import { of } from 'rxjs';

@Component({
	selector: 'app-comment-update-form',
	standalone: true,
	template: '',
})
class CommentUpdateFormStub {
	comment = input.required<Comment>();

	commentEdited = output<void>();
	canceledCommentEdit = output<void>();
}

describe('CommentElement', () => {
	let fixture: ComponentFixture<CommentElement>;
	let component: CommentElement;
	let html: HTMLElement;

	let commentServiceMock = { deleteComment: vi.fn() };

	const comment: Comment = {
		id: 1,
		content: 'Good',
		user: {
			id: 1,
			username: 'john'
		}
	};

	async function createComponent(shouldAwait: boolean = true) {
		fixture = TestBed.createComponent(CommentElement);
		component = fixture.componentInstance;
		html = fixture.nativeElement;

		fixture.componentRef.setInput('comment', comment);

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
			]
		}).overrideComponent(CommentElement, {
			remove: {
				imports: [CommentUpdateForm],
			},
			add: {
				imports: [CommentUpdateFormStub],
			}
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

	it('should emit commentEdited when CommentUpdateForm emits commentEdited, and hide the form', async () => {
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

		await createComponent();

		const emitSpy = vi.spyOn(component.commentDeleted, 'emit');

		const deletColumnButton = Array
			.from(html.querySelectorAll('button'))
			.find(button => button.textContent?.includes('Delete'));

		expect(deletColumnButton).toBeTruthy();

		deletColumnButton!.click();

		await fixture.whenStable();

		expect(commentServiceMock.deleteComment).toHaveBeenCalledWith(1);
		expect(emitSpy).toHaveBeenCalled();
	});

	it('should hide comment update form when CommentUpdateForm emits canceledCommentEdit', async () => {
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
