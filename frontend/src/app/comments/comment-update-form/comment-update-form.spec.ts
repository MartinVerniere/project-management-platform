import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CommentUpdateForm } from './comment-update-form';
import { Comment, CommentService } from '../../services/comments/comment-service';
import { of, throwError } from 'rxjs';

describe('CommentUpdateForm', () => {
	let fixture: ComponentFixture<CommentUpdateForm>;
	let component: CommentUpdateForm;
	let html: HTMLElement;

	const currentComment: Comment = {
		id: 1,
		content: 'Good',
		user: {
			id: 1,
			username: 'john'
		}
	};

	let commentServiceMock = { updateComment: vi.fn().mockReturnValue(of({})) };

	async function createComponent(shouldAwait: boolean = true) {
		fixture = TestBed.createComponent(CommentUpdateForm);
		component = fixture.componentInstance;
		html = fixture.nativeElement;

		fixture.componentRef.setInput('comment', currentComment);

		fixture.detectChanges();

		if (shouldAwait) {
			await fixture.whenStable();
			fixture.detectChanges();
		}
	}

	beforeEach(async () => {
		vi.clearAllMocks();

		await TestBed.configureTestingModule({
			imports: [CommentUpdateForm],
			providers: [
				{ provide: CommentService, useValue: commentServiceMock }
			]
		}).compileComponents();
	});

	it('should create', async () => {
		await createComponent();

		expect(component).toBeTruthy();
	});

	it('should load existing comment into the form', async () => {
		await createComponent();

		expect(component.commentModel()).toEqual({ content: 'Good' });
	});

	it('should update comment when valid form data, then emit commentEdited', async () => {
		await createComponent();

		component.commentModel.set({ content: 'Updated Good' });
		const emitSpy = vi.spyOn(component.commentEdited, 'emit');

		await component.onSubmit(new Event('submit'));

		expect(commentServiceMock.updateComment).toHaveBeenCalledWith(currentComment.id, { content: 'Updated Good' });
		expect(emitSpy).toHaveBeenCalled();
	});

	it('should set error when updating board fails', async () => {
		commentServiceMock.updateComment.mockReturnValue(throwError(() => ({
			error: {
				error: {
					code: 'ERROR_MESSAGE',
					message: 'Error message'
				}
			}
		})));

		await createComponent();

		component.commentModel.set({ content: 'ERROR CONTENT' });

		await component.onSubmit(new Event('submit'));

		expect(component.error()).not.toBe('');
	});

	it('should emit canceledCommentEdit on "Cancel" button click', async () => {
		await createComponent();

		const emitSpy = vi.spyOn(component.canceledCommentEdit, 'emit');

		const cancelButton = Array
			.from(html.querySelectorAll('button'))
			.find(button => button.textContent?.includes('Cancel'));

		expect(cancelButton).toBeTruthy();

		cancelButton!.click();

		component.onCancel();

		await fixture.whenStable();

		expect(emitSpy).toHaveBeenCalled();
	});
});
