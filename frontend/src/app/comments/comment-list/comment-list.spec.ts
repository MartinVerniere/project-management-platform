import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CommentList } from './comment-list';
import { Component, input, output } from '@angular/core';
import { CommentElement } from '../comment-element/comment-element';
import { CommentForm } from '../comment-form/comment-form';
import { By } from '@angular/platform-browser';
import type { CommentDto } from '@shared/models/comment';
import type { UserDto } from '@shared/models/user';

@Component({
	selector: 'app-comment-element',
	standalone: true,
	template: '',
})
class CommentElementStub {
	comment = input.required<CommentDto>();
	hasAdminPermissions = input.required<boolean>();

	commentEdited = output<void>();
	commentDeleted = output<void>();
}

@Component({
	selector: 'app-comment-form',
	standalone: true,
	template: '',
})
class CommentFormStub {
	taskId = input.required<number>();

	commentAdded = output<void>();
	canceledCommentAdd = output<void>();
}

describe('CommentList', () => {
	let fixture: ComponentFixture<CommentList>;
	let component: CommentList;

	const commentAuthor: UserDto = {
		id: 0,
		username: 'john',
		email: 'john@test.com',
		avatarUrl: null
	};

	const commentList: CommentDto[] = [
		{
			id: 1,
			content: 'Good',
			author: commentAuthor,
			taskId: 1
		},
		{
			id: 2,
			content: 'Great',
			author: commentAuthor,
			taskId: 1
		}
	]

	const taskId = 1;

	async function createComponent(shouldAwait = true, hasAdminPermissions = true) {
		fixture = TestBed.createComponent(CommentList);
		component = fixture.componentInstance;

		fixture.componentRef.setInput('commentList', commentList);
		fixture.componentRef.setInput('taskId', taskId);
		fixture.componentRef.setInput('hasAdminPermissions', hasAdminPermissions);

		fixture.detectChanges();

		if (shouldAwait) {
			await fixture.whenStable();
			fixture.detectChanges();
		}
	}

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			imports: [CommentList],
		}).overrideComponent(CommentList, {
			remove: { imports: [CommentElement, CommentForm] },
			add: { imports: [CommentElementStub, CommentFormStub] }
		}).compileComponents();
	});

	it('should create', async () => {
		await createComponent();

		expect(component).toBeTruthy();
	});

	it('should render comments', async () => {
		await createComponent();

		const children = fixture.debugElement.queryAll(By.directive(CommentElementStub));

		expect(children).toHaveLength(2);
	});

	it('should enable add comment form on "Add comment" button click', async () => {
		await createComponent();

		component.onEnableAddComment();

		expect(component.addCommentFormEnabled()).toBe(true);
	});

	it('should disable add comment form on cancel', async () => {
		await createComponent();

		component.onEnableAddComment();
		component.onCancelAddComment();

		expect(component.addCommentFormEnabled()).toBe(false);
	});

	it('should emit commentListEdited when CommentElement emits commentEdited', async () => {
		await createComponent();

		const child = fixture.debugElement
			.query(By.directive(CommentElementStub))
			.componentInstance as CommentElementStub;

		const emitSpy = vi.spyOn(component.commentListEdited, 'emit');

		child.commentEdited.emit();

		expect(emitSpy).toHaveBeenCalled();
	});

	it('should emit commentListEdited when CommentElement emits commentDeleted', async () => {
		await createComponent();

		const child = fixture.debugElement
			.query(By.directive(CommentElementStub))
			.componentInstance as CommentElementStub;

		const emitSpy = vi.spyOn(component.commentListEdited, 'emit');

		child.commentDeleted.emit();

		expect(emitSpy).toHaveBeenCalled();
	});

	it('should emit commentListEdited when CommentForm emits commentAdded, and hide the form', async () => {
		await createComponent();

		component.onEnableAddComment();

		fixture.detectChanges();

		const child = fixture.debugElement
			.query(By.directive(CommentFormStub))
			.componentInstance as CommentFormStub;

		const emitSpy = vi.spyOn(component.commentListEdited, 'emit');

		child.commentAdded.emit();

		expect(component.addCommentFormEnabled()).toBe(false);
		expect(emitSpy).toHaveBeenCalled();
	});
});
