import { TestBed } from '@angular/core/testing';
import { TaskUpdateForm } from './task-update-form';
import { of, throwError } from 'rxjs';
import { provideRouter, Router } from '@angular/router';
import { TaskService } from '../../services/tasks/task-service';
import type { TaskDto } from '@shared/models/task';
import { RouterTestingHarness } from '@angular/router/testing';
import { Component } from '@angular/core';

@Component({ standalone: true, template: '' }) class DummyComponent { }

describe('TaskUpdateForm', () => {
	let component: TaskUpdateForm;
	let harness: RouterTestingHarness;
	let router: Router;

	let taskServiceMock = {
		getTask: vi.fn(),
		updateTask: vi.fn()
	};

	const currentTask: TaskDto = { id: 1, title: "Task A", description: '', columnId: 1, order: 0 };

	async function createComponent(shouldAwait = true) {
		component = await harness.navigateByUrl('/projects/1/boards/1/columns/1/tasks/1/edit', TaskUpdateForm);

		if (shouldAwait) {
			await harness.fixture.whenStable();
			harness.detectChanges();
		};
	};

	function setDefaultReturnValues() {
		taskServiceMock.getTask.mockReturnValue(of(currentTask));
		taskServiceMock.updateTask.mockReturnValue(of({}));
	};

	async function setHarnessAndRouter() {
		harness = await RouterTestingHarness.create();
		router = TestBed.inject(Router);
	};

	beforeEach(async () => {
		vi.clearAllMocks();

		setDefaultReturnValues();

		await TestBed.configureTestingModule({
			imports: [TaskUpdateForm],
			providers: [
				{ provide: TaskService, useValue: taskServiceMock },
				provideRouter([
					{ path: 'projects/:projectId/boards/:boardId/columns/:columnId/tasks/:taskId/edit', component: TaskUpdateForm },
					{ path: 'projects/:id/boards/:boardId', component: DummyComponent },
				]),
			]
		}).compileComponents();

		await setHarnessAndRouter();
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

		harness.detectChanges(); 
		await harness.fixture.whenStable();

		const updateButton = Array
			.from(harness.routeNativeElement!.querySelectorAll('button'))
			.find(button => button.textContent?.includes('Update task'));

		expect(updateButton).toBeTruthy();

		updateButton!.click();

		await harness.fixture.whenStable();
		harness.detectChanges();

		expect(taskServiceMock.updateTask).toHaveBeenCalledWith(currentTask.id, { title: 'Updated A', description: 'Desc' });
		expect(component.taskModel()).toEqual({ title: '', description: '' });
		expect(router.url).toBe('/projects/1/boards/1');
	});

	it('should not update board when invalid form data', async () => {
		await createComponent();

		component.resetForm(); //Clear information loaded from fetch

		harness.detectChanges(); 
		await harness.fixture.whenStable();

		const updateButton = Array
			.from(harness.routeNativeElement!.querySelectorAll('button'))
			.find(button => button.textContent?.includes('Update task'));

		expect(updateButton).toBeTruthy();
		expect(updateButton!.disabled).toBe(true); 

		updateButton!.click();

		await harness.fixture.whenStable();
		harness.detectChanges();

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

		harness.detectChanges(); 
		await harness.fixture.whenStable();

		const updateButton = Array
			.from(harness.routeNativeElement!.querySelectorAll('button'))
			.find(button => button.textContent?.includes('Update task'));

		expect(updateButton).toBeTruthy();

		updateButton!.click();

		await harness.fixture.whenStable();
		harness.detectChanges();

		expect(component.error()).not.toBe('');
	});
});
