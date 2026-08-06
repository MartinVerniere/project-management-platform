import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TaskList } from './task-list';
import { ColumnService } from '../../services/columns/column-service';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';
import { Component, input, output } from '@angular/core';
import { By } from '@angular/platform-browser';
import { TaskElement } from '../task-element/task-element';
import { CdkDragDrop } from '@angular/cdk/drag-drop';
import { ProjectMemberResponse } from '../../models/project';
import { TaskResponse } from '../../models/task';

@Component({
	selector: 'app-task-element',
	standalone: true,
	template: '',
})
class TaskElementStub {
	task = input.required<TaskResponse>();
	projectId = input.required<number>();
	boardId = input.required<number>();
	columnId = input.required<number>();
	memberList = input.required<ProjectMemberResponse[]>();

	taskDeleted = output<void>();
	taskCommentsEdited = output<void>();
	taskAssigneeEdited = output<void>();
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

	const taskList: TaskResponse[] = [
		{ id: 1, title: "Task A", comments: [] },
		{ id: 2, title: "Task B", comments: [] }
	];

	const projectId = 1;
	const boardId = 1;
	const columnId = 1;

	const memberList: ProjectMemberResponse[] = [
		{
			id: 1,
			role: 'ADMIN',
			user: {
				id: 1,
				username: 'john',
				email: 'john@example.com'
			}
		},
		{
			id: 2,
			role: 'MEMBER',
			user: {
				id: 3,
				username: 'martin',
				email: 'martin@example.com'
			}
		},
		{
			id: 3,
			role: 'MEMBER',
			user: {
				id: 2,
				username: 'alice',
				email: 'alice@example.com'
			}
		}
	];

	async function createComponent(shouldAwait: boolean = true, taskList: TaskResponse[] = [], filtersActive: boolean = false) {
		fixture = TestBed.createComponent(TaskList);
		component = fixture.componentInstance;
		html = fixture.nativeElement;

		fixture.componentRef.setInput('taskList', taskList);
		fixture.componentRef.setInput('projectId', projectId);
		fixture.componentRef.setInput('boardId', boardId);
		fixture.componentRef.setInput('columnId', columnId);
		fixture.componentRef.setInput('memberList', memberList);
		fixture.componentRef.setInput('filtersActive', filtersActive);
		
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

		expect(html.textContent).toContain('No tasks yet!');
	});

	it('should emit task moveTaskToColumn with task.Id when task was dragged from another column', async () => {
		const previousContainer = {};
		const destinationContainer = {};

		const dropTaskEvent = {
			item: { data: { type: 'task', task: taskList[1] } },
			previousContainer,
			container: destinationContainer,
			previousIndex: 1,
			currentIndex: 0
		} as CdkDragDrop<TaskResponse[]>;

		await createComponent(true, taskList);

		const emitSpy = vi.spyOn(component.moveTaskToColumn, 'emit');

		component.onMoveTask(dropTaskEvent);

		expect(emitSpy).toHaveBeenCalledWith(taskList[1].id);
		expect(component.error()).toBeNull();
	});

	it('should change task order when task was dragged inside the task list to a different position in same column and emit taskListEdited', async () => {
		const container = {};

		const dropTaskEvent = {
			item: { data: { type: 'task', task: taskList[1] } },
			previousContainer: container,
			container: container,
			previousIndex: 1,
			currentIndex: 0
		} as CdkDragDrop<TaskResponse[]>;

		const expectedOrder = [
			{ id: 2, order: 0 },
			{ id: 1, order: 1 }
		];

		columnServiceMock.changeTaskOrder.mockReturnValue(of({}));

		await createComponent(true, taskList);

		const emitSpy = vi.spyOn(component.taskListEdited, 'emit');

		component.onMoveTask(dropTaskEvent);

		expect(columnServiceMock.changeTaskOrder).toHaveBeenCalledWith(columnId, { taskOrder: expectedOrder });
		expect(emitSpy).toHaveBeenCalled();
		expect(component.error()).toBeNull();
	});

	it('should NOT change task order when task was dragged inside the task list and filtering is active', async () => {
		const container = {};

		const dropTaskEvent = {
			item: { data: { type: 'task', task: taskList[1] } },
			previousContainer: container,
			container: container,
			previousIndex: 1,
			currentIndex: 0
		} as CdkDragDrop<TaskResponse[]>;

		columnServiceMock.changeTaskOrder.mockReturnValue(of({}));

		await createComponent(true, taskList, true);

		const emitSpy = vi.spyOn(component.taskListEdited, 'emit');

		component.onMoveTask(dropTaskEvent);

		expect(columnServiceMock.changeTaskOrder).not.toHaveBeenCalled();
		expect(emitSpy).not.toHaveBeenCalled();
		expect(component.error()).toBeNull();
	});

	it('should NOT emit task moveTaskToColumn with task.Id when task was dragged from another column and filtering is active', async () => {
		const previousContainer = {};
		const destinationContainer = {};

		const dropTaskEvent = {
			item: { data: { type: 'task', task: taskList[1] } },
			previousContainer,
			container: destinationContainer,
			previousIndex: 1,
			currentIndex: 0
		} as CdkDragDrop<TaskResponse[]>;

		await createComponent(true, taskList, true);

		const emitSpy = vi.spyOn(component.moveTaskToColumn, 'emit');

		component.onMoveTask(dropTaskEvent);

		expect(emitSpy).not.toHaveBeenCalled();
		expect(component.error()).toBeNull();
	});

	it('should emit taskListEdited when TaskElement emits taskDeleted', async () => {
		await createComponent(true, taskList);

		const child = fixture.debugElement
			.query(By.directive(TaskElementStub))
			.componentInstance as TaskElementStub;

		const emitSpy = vi.spyOn(component.taskListEdited, 'emit');

		child.taskDeleted.emit();

		expect(emitSpy).toHaveBeenCalled();
	});

	it('should emit taskListEdited when TaskElement emits taskCommentsEdited', async () => {
		await createComponent(true, taskList);

		const child = fixture.debugElement
			.query(By.directive(TaskElementStub))
			.componentInstance as TaskElementStub;

		const emitSpy = vi.spyOn(component.taskListEdited, 'emit');

		child.taskCommentsEdited.emit();

		expect(emitSpy).toHaveBeenCalled();
	});

	it('should emit taskListEdited when TaskElement emits taskAssigneeEdited', async () => {
		await createComponent(true, taskList);

		const child = fixture.debugElement
			.query(By.directive(TaskElementStub))
			.componentInstance as TaskElementStub;

		const emitSpy = vi.spyOn(component.taskListEdited, 'emit');

		child.taskAssigneeEdited.emit();

		expect(emitSpy).toHaveBeenCalled();
	});
});
