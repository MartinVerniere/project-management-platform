import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CommentForm } from './comment-form';
import { TaskService } from '../../services/tasks/task-service';
import { of, throwError } from 'rxjs';

describe('CommentForm', () => {
	let fixture: ComponentFixture<CommentForm>;
	let component: CommentForm;
	let html: HTMLElement;

	const taskServiceMock = { addComment: vi.fn() };

	const taskId = 1;

	async function createComponent(shouldAwait: boolean = true) {
		fixture = TestBed.createComponent(CommentForm);
		component = fixture.componentInstance;
		html = fixture.nativeElement;

		fixture.componentRef.setInput('taskId', taskId);

		fixture.detectChanges();

		if (shouldAwait) {
			await fixture.whenStable();
			fixture.detectChanges();
		};
	};

	function setDefaultReturnValues() {
		taskServiceMock.addComment.mockReturnValue(of({}));
	};

	beforeEach(async () => {
		vi.clearAllMocks();

		setDefaultReturnValues();

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
		await createComponent();

		const emitSpy = vi.spyOn(component.commentAdded, 'emit');

		component.commentModel.set({ content: 'Good' });

		await fixture.whenStable();
		fixture.detectChanges();

		const createButton = Array
			.from(html.querySelectorAll('button'))
			.find(button => button.textContent?.includes('Add comment'));

		expect(createButton).toBeTruthy();

		createButton!.click();

		await fixture.whenStable();
		fixture.detectChanges();

		expect(taskServiceMock.addComment).toHaveBeenCalledWith(1, { content: 'Good' });
		expect(emitSpy).toHaveBeenCalled();
		expect(component.commentModel()).toEqual({ content: '' });
	});

	it('should set error when adding comment fails', async () => {
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

		await fixture.whenStable();
		fixture.detectChanges();

		const createButton = Array
			.from(html.querySelectorAll('button'))
			.find(button => button.textContent?.includes('Add comment'));

		expect(createButton).toBeTruthy();

		createButton!.click();

		await fixture.whenStable();
		fixture.detectChanges();

		expect(component.error()).toBe('Error message');
	});

	it('should emit canceledCommentAdd on cancel', async () => {
		await createComponent();

		const emitSpy = vi.spyOn(component.canceledCommentAdd, 'emit');

		component.onCancel();

		expect(emitSpy).toHaveBeenCalled();
	});
});
