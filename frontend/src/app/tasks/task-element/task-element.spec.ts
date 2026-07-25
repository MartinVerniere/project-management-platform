import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TaskElement } from './task-element';
import { Task, TaskService } from '../../services/tasks/task-service';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';

describe('TaskElement', () => {
	let fixture: ComponentFixture<TaskElement>;
	let component: TaskElement;
	let html: HTMLElement;

	const activatedRouteMock = {
		snapshot: {
			paramMap: {
				get: (key: string) => {
					if (key === 'projectId') return '1';
					if (key === 'boardId') return '1';
					return null;
				}
			}
		}
	};

	let taskServiceMock = { deleteTask: vi.fn() };

	const task: Task = {
		id: 1,
		title: 'Task A',
		description: 'Description'
	};

	const projectId = 1;
	const boardId = 1;
	const columnId = 1;

	async function createComponent(shouldAwait: boolean = true, isFirst = false, isLast = false) {
		fixture = TestBed.createComponent(TaskElement);
		component = fixture.componentInstance;
		html = fixture.nativeElement;

		fixture.componentRef.setInput('task', task);
		fixture.componentRef.setInput('projectId', projectId);
		fixture.componentRef.setInput('boardId', boardId);
		fixture.componentRef.setInput('columnId', columnId);
		fixture.componentRef.setInput('isFirst', isFirst);
		fixture.componentRef.setInput('isLast', isLast);

		fixture.detectChanges();

		if (shouldAwait) {
			await fixture.whenStable();
			fixture.detectChanges();
		}
	}

	beforeEach(async () => {
		vi.clearAllMocks();

		await TestBed.configureTestingModule({
			imports: [TaskElement],
			providers: [
				{ provide: TaskService, useValue: taskServiceMock },
				{ provide: ActivatedRoute, useValue: activatedRouteMock }
			]
		}).compileComponents();
	});

	it('should create', async () => {
		await createComponent();

		expect(component).toBeTruthy();
	});

	it('should render task information', async () => {
		await createComponent();

		expect(html.textContent).toContain('Task A');
	});

	it('should have "move up" button disabled when it is the first task', async () => {
		await createComponent(true, true, false);

		const moveUpButton = Array
			.from(html.querySelectorAll('button'))
			.find(button => button.textContent?.includes('Move up'));

		expect(moveUpButton).toBeTruthy();
		expect(moveUpButton!.hasAttribute('disabled')).toBe(true);
	});

	it('should have "move down" button disabled when it is the last task', async () => {
		await createComponent(true, false, true);

		const moveDownButton = Array
			.from(html.querySelectorAll('button'))
			.find(button => button.textContent?.includes('Move down'));

		expect(moveDownButton).toBeTruthy();
		expect(moveDownButton!.hasAttribute('disabled')).toBe(true);
	});

	it('should emit moveUp on "Move up" button clicked', async () => {
		await createComponent();

		const emitSpy = vi.spyOn(component.moveUp, 'emit');

		const moveUpButton = Array
			.from(html.querySelectorAll('button'))
			.find(button => button.textContent?.includes('Move up'));

		expect(moveUpButton).toBeTruthy();

		moveUpButton!.click();

		await fixture.whenStable();

		expect(emitSpy).toHaveBeenCalledWith(1);
	});

	it('should emit moveDown on "Move down" button clicked', async () => {
		await createComponent();

		const emitSpy = vi.spyOn(component.moveDown, 'emit');

		const moveDownButton = Array
			.from(html.querySelectorAll('button'))
			.find(button => button.textContent?.includes('Move down'));

		expect(moveDownButton).toBeTruthy();

		moveDownButton!.click();

		await fixture.whenStable();

		expect(emitSpy).toHaveBeenCalledWith(1);
	});


	it('should remove task and emit taskRemoved when "Delete" button is clicked', async () => {
		taskServiceMock.deleteTask.mockReturnValue(of({}));

		await createComponent();

		const emitSpy = vi.spyOn(component.taskDeleted, 'emit');

		const deletColumnButton = Array
			.from(html.querySelectorAll('button'))
			.find(button => button.textContent?.includes('Delete'));

		expect(deletColumnButton).toBeTruthy();

		deletColumnButton!.click();

		await fixture.whenStable();

		expect(taskServiceMock.deleteTask).toHaveBeenCalledWith(1);
		expect(emitSpy).toHaveBeenCalled();
	});
});
