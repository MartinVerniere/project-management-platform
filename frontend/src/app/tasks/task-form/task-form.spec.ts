import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TaskForm } from './task-form';
import { ColumnService } from '../../services/columns/column-service';
import { ActivatedRoute, Router } from '@angular/router';
import { of, throwError } from 'rxjs';

describe('TaskForm', () => {
	let fixture: ComponentFixture<TaskForm>;
	let component: TaskForm;
	let html: HTMLElement;

	const columnServiceMock = { addTask: vi.fn() };
	const routerMock = { navigate: vi.fn().mockResolvedValue(true) };

	const activatedRouteMock = {
		snapshot: {
			paramMap: {
				get: (key: string) => {
					if (key === 'projectId') return '1';
					if (key === 'boardId') return '1';
					if (key === 'columnId') return '1';
					return null;
				}
			}
		}
	}

	async function createComponent(shouldAwait: boolean = true) {
		fixture = TestBed.createComponent(TaskForm);
		component = fixture.componentInstance;
		html = fixture.nativeElement;

		fixture.detectChanges();

		if (shouldAwait) {
			await fixture.whenStable();
			fixture.detectChanges();
		}
	}

	beforeEach(async () => {
		vi.clearAllMocks();

		await TestBed.configureTestingModule({
			imports: [TaskForm],
			providers: [
				{ provide: ColumnService, useValue: columnServiceMock },
				{ provide: ActivatedRoute, useValue: activatedRouteMock },
				{ provide: Router, useValue: routerMock }
			]
		}).compileComponents();
	});

	it('should create', async () => {
		await createComponent();

		expect(component).toBeTruthy();
	});

	it('should create task when valid form data, then redirect to /projects/:projectId/boards/:boardId and clear form', async () => {
		columnServiceMock.addTask.mockReturnValue(of({}));

		await createComponent();

		component.taskModel.set({ title: 'Task A', description: 'Desc' });

		await component.onSubmit(new Event('submit'));

		expect(columnServiceMock.addTask).toHaveBeenCalledWith(1, { title: 'Task A', description: 'Desc' });
		expect(routerMock.navigate).toHaveBeenCalledWith(['/projects', 1, 'boards', 1]);
		expect(component.taskModel()).toEqual({ title: '', description: '' });
	});

	it('should not create task when invalid form data', async () => {
		await createComponent();

		await component.onSubmit(new Event('submit'));

		await fixture.whenStable();

		expect(columnServiceMock.addTask).not.toHaveBeenCalled();
	});

	it('should set error when creating task fails', async () => {
		columnServiceMock.addTask.mockReturnValue(throwError(() => ({
			error: {
				error: {
					code: 'ERROR_MESSAGE',
					message: 'Error message'
				}
			}
		})));

		await createComponent();

		component.taskModel.set({ title: 'ERROR NAME', description: '' });

		await component.onSubmit(new Event('submit'));

		expect(component.error()).not.toBe('');
	});
});
