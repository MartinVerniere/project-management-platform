import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TaskUpdateForm } from './task-update-form';
import { Task, TaskService } from '../../services/tasks/task-service';
import { of, throwError } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';

describe('TaskUpdateForm', () => {
	let fixture: ComponentFixture<TaskUpdateForm>;
	let component: TaskUpdateForm;
	let html: HTMLElement;

	const currentTask: Task = {
		id: 1,
		title: "Task A",
		description: '',
		comments: []
	};

	let taskServiceMock = {
		getTask: vi.fn().mockReturnValue(of(currentTask)),
		updateTask: vi.fn().mockReturnValue(of({}))
	};

	let routerMock = { navigate: vi.fn().mockResolvedValue(true) };

	const activatedRouteMock = {
		snapshot: {
			paramMap: {
				get: (key: string) => {
					if (key === 'projectId') return '1';
					if (key === 'boardId') return '1';
					if (key === 'columnId') return '1';
					if (key === 'taskId') return '1';
					return null;
				}
			}
		}
	};

	async function createComponent(shouldAwait: boolean = true) {
		fixture = TestBed.createComponent(TaskUpdateForm);
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
			imports: [TaskUpdateForm],
			providers: [
				{ provide: TaskService, useValue: taskServiceMock },
				{ provide: ActivatedRoute, useValue: activatedRouteMock },
				{ provide: Router, useValue: routerMock },
			]
		}).compileComponents();
	});

	it('should create', async () => {
		await createComponent();

		expect(component).toBeTruthy();
	});

	it('should load task', async () => {
		await createComponent();

		expect(taskServiceMock.getTask).toHaveBeenCalledWith(1);
	});

	it('should load existing task into the form', async () => {
		await createComponent();

		expect(component.taskModel()).toEqual({ title: 'Task A', description: '' });
	});

	it('should update task when valid form data, then redirect to /projects/:projectId/boards/:boardId and clear form', async () => {
		await createComponent();

		component.taskModel.set({ title: 'Updated A', description: 'Desc' });

		await component.onSubmit(new Event('submit'));

		expect(taskServiceMock.updateTask).toHaveBeenCalledWith(currentTask.id, { title: 'Updated A', description: 'Desc' });
		expect(routerMock.navigate).toHaveBeenCalledWith(['/projects', 1, 'boards', 1]);
		expect(component.taskModel()).toEqual({ title: '', description: '' });
	});

	it('should not update board when invalid form data', async () => {
		await createComponent();

		component.resetForm(); //Clear information loaded from fetch

		await component.onSubmit(new Event('submit'));

		await fixture.whenStable();

		expect(taskServiceMock.updateTask).not.toHaveBeenCalled();
	});

	it('should set error when updating board fails', async () => {
		taskServiceMock.updateTask.mockReturnValue(throwError(() => ({
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
