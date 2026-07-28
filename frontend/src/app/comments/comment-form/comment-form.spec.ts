import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CommentForm } from './comment-form';
import { TaskService } from '../../services/tasks/task-service';
import { of, throwError } from 'rxjs';

describe('CommentForm', () => {
	let fixture: ComponentFixture<CommentForm>;
	let component: CommentForm;

	const taskServiceMock = { addComment: vi.fn() };

	const taskId = 1;

	async function createComponent(shouldAwait: boolean = true) {
		fixture = TestBed.createComponent(CommentForm);
		component = fixture.componentInstance;

		fixture.componentRef.setInput('taskId', taskId);

		fixture.detectChanges();

		if (shouldAwait) {
			await fixture.whenStable();
			fixture.detectChanges();
		}
	}

	beforeEach(async () => {
		vi.clearAllMocks();

		await TestBed.configureTestingModule({
			imports: [CommentForm],
			providers: [
				{ provide: TaskService, useValue: taskServiceMock },
			]
		}).compileComponents();
	});

	it('should create', async () => {
		await createComponent();

		expect(component).toBeTruthy();
	});

	it('should add comment and emit commentAdded on valid data', async () => {
		taskServiceMock.addComment.mockReturnValue(of({}));

		await createComponent();

		const emitSpy = vi.spyOn(component.commentAdded, 'emit');

		component.commentModel.set({ content: 'Good' });

		await component.onSubmit(new Event('submit'));

		expect(taskServiceMock.addComment).toHaveBeenCalledWith(1, { content: 'Good' });
		expect(emitSpy).toHaveBeenCalled();
		expect(component.commentModel()).toEqual({ content: '' });
	});

	it('should set error when adding member fails', async () => {
		taskServiceMock.addComment.mockReturnValue(throwError(() => ({
			error: {
				error: {
					code: 'ERROR_MESSAGE',
					message: 'Error message'
				}
			}
		})));

		await createComponent();

		component.commentModel.set({ content: 'ERROR' });

		await component.onSubmit(new Event('submit'));

		expect(component.error()).toBe('Error message');
	});

	it('should emit canceledCommentAdd on cancel', async () => {
		await createComponent();

		const emitSpy = vi.spyOn(component.canceledCommentAdd, 'emit');

		component.onCancel();

		expect(emitSpy).toHaveBeenCalled();
	});
});
