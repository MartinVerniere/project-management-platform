import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TaskList } from './task-list';
import { Task } from '../../services/tasks/task-service';
import { Column, ColumnService } from '../../services/columns/column-service';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';
import { Component, input, output } from '@angular/core';
import { By } from '@angular/platform-browser';
import { TaskElement } from '../task-element/task-element';

@Component({
	selector: 'app-task-element',
	standalone: true,
	template: '',
})
class TaskElementStub {
	task = input.required<Task>();
	isFirst = input<boolean>();
	isLast = input<boolean>();
	projectId = input.required<number>();
	boardId = input.required<number>();
	columnId = input.required<number>();

	taskDeleted = output<void>();
	moveUp = output<number>();
	moveDown = output<number>();
}

describe('TaskList', () => {
	let fixture: ComponentFixture<TaskList>;
	let component: TaskList;
	let html: HTMLElement;

	const columnServiceMock = { changeTaskOrder: vi.fn() };

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

	const taskList: Task[] = [
		{ id: 1, title: "Task A" },
		{ id: 2, title: "Task B" }
	];

	const projectId = 1;
	const boardId = 1;
	const columnId = 1;

	async function createComponent(shouldAwait: boolean = true, taskList: Task[] = []) {
		fixture = TestBed.createComponent(TaskList);
		component = fixture.componentInstance;
		html = fixture.nativeElement;

		fixture.componentRef.setInput('taskList', taskList);
		fixture.componentRef.setInput('projectId', projectId);
		fixture.componentRef.setInput('boardId', boardId);
		fixture.componentRef.setInput('columnId', columnId);

		fixture.detectChanges();

		if (shouldAwait) {
			await fixture.whenStable();
			fixture.detectChanges();
		}
	}

	beforeEach(async () => {
		vi.clearAllMocks();

		await TestBed.configureTestingModule({
			imports: [TaskList],
			providers: [
				{ provide: ColumnService, useValue: columnServiceMock },
				{ provide: ActivatedRoute, useValue: activatedRouteMock },
			]
		}).overrideComponent(TaskList, {
			remove: {
				imports: [TaskElement],
			},
			add: {
				imports: [TaskElementStub],
			}
		}).compileComponents();
	});

	it('should create', async () => {
		await createComponent(true, taskList);

		expect(component).toBeTruthy();
	});

	it('should render tasks', async () => {
		await createComponent(true, taskList);

		const children = fixture.debugElement.queryAll(By.directive(TaskElementStub));

		expect(children).toHaveLength(2);
	});

	it('should render empty message when no task exists', async () => {
		await createComponent(true);

		expect(html.textContent).toContain('No tasks in this project');
	});

	it('should change task order when task is moved up and emit taskMoved', async () => {
		const expectedOrder = [
			{ id: 2, order: 0 },
			{ id: 1, order: 1 },
		];

		columnServiceMock.changeTaskOrder.mockReturnValue(of({}));

		await createComponent(true, taskList);

		const emitSpy = vi.spyOn(component.taskMoved, 'emit');

		component.onMoveUp(2);

		expect(columnServiceMock.changeTaskOrder).toHaveBeenCalledWith(1, { taskOrder: expectedOrder });
		expect(emitSpy).toHaveBeenCalled();
		expect(component.error()).toBeNull();
	});

	it('should change task order when task is moved down and emit taskMoved', async () => {
		const expectedOrder = [
			{ id: 2, order: 0 },
			{ id: 1, order: 1 },
		];

		columnServiceMock.changeTaskOrder.mockReturnValue(of({}));

		await createComponent(true, taskList);

		const emitSpy = vi.spyOn(component.taskMoved, 'emit');

		component.onMoveDown(1);

		expect(columnServiceMock.changeTaskOrder).toHaveBeenCalledWith(1, { taskOrder: expectedOrder });
		expect(emitSpy).toHaveBeenCalled();
		expect(component.error()).toBeNull();
	});

	it('should delete task when task is deleted', async () => {
		await createComponent(true, taskList);

		const child = fixture.debugElement
			.query(By.directive(TaskElementStub))
			.componentInstance as TaskElementStub;

		const emitSpy = vi.spyOn(component.taskDeleted, 'emit');

		child.taskDeleted.emit();

		expect(emitSpy).toHaveBeenCalled();
	});
});
