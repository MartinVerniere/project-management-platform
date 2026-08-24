import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TaskList } from './task-list';
import { ColumnService } from '../../services/columns/column-service';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { Component, input, output } from '@angular/core';
import { By } from '@angular/platform-browser';
import { TaskElement } from '../task-element/task-element';
import { CdkDragDrop } from '@angular/cdk/drag-drop';
import type { TaskDetailsDto } from '@shared/models/task';
import type { ProjectMemberDto } from '@shared/models/project';

@Component({
	selector: 'app-task-element',
	standalone: true,
	template: '',
})
class TaskElementStub {
	task = input.required<TaskDetailsDto>();
	projectId = input.required<number>();
	boardId = input.required<number>();
	columnId = input.required<number>();
	memberList = input.required<ProjectMemberDto[]>();
	hasAdminPermissions = input.required<boolean>();

	taskDeleted = output<void>();
	taskCommentsEdited = output<void>();
	taskAssigneeEdited = output<void>();
}

describe('TaskList', () => {
	let fixture: ComponentFixture<TaskList>;
	let component: TaskList;
	let html: HTMLElement;

	const columnServiceMock = { changeTaskOrder: vi.fn() };

	const projectId = 1;
	const boardId = 1;
	const columnId = 1;

	const taskList: TaskDetailsDto[] = [
		{ id: 1, title: "Task A", comments: [], assignee: null, description: null, columnId, order: 0 },
		{ id: 2, title: "Task B", comments: [], assignee: null, description: null, columnId, order: 1 }
	];

	const memberList: ProjectMemberDto[] = [
		{
			id: 1,
			role: 'ADMIN',
			user: { id: 1, username: 'john', email: 'john@example.com', avatarUrl: '/images/default-avatar.png' }
		},
		{
			id: 2,
			role: 'MEMBER',
			user: { id: 3, username: 'martin', email: 'martin@example.com', avatarUrl: '/images/default-avatar.png' }
		},
		{
			id: 3,
			role: 'MEMBER',
			user: { id: 2, username: 'alice', email: 'alice@example.com', avatarUrl: '/images/default-avatar.png' }
		}
	];

	async function createComponent(shouldAwait = true, filtersActive = false, tasks = taskList) {
		fixture = TestBed.createComponent(TaskList);
		component = fixture.componentInstance;
		html = fixture.nativeElement;

		fixture.componentRef.setInput('taskList', tasks);
		fixture.componentRef.setInput('projectId', projectId);
		fixture.componentRef.setInput('boardId', boardId);
		fixture.componentRef.setInput('columnId', columnId);
		fixture.componentRef.setInput('memberList', memberList);
		fixture.componentRef.setInput('filtersActive', filtersActive);
		fixture.componentRef.setInput('hasAdminPermissions', true);

		fixture.detectChanges();

		if (shouldAwait) {
			await fixture.whenStable();
			fixture.detectChanges();
		};
	};

	function setDefaultReturnValues() {
		columnServiceMock.changeTaskOrder.mockReturnValue(of({}));
	};

	beforeEach(async () => {
		vi.clearAllMocks();

		setDefaultReturnValues();

		await TestBed.configureTestingModule({
			imports: [TaskList],
			providers: [
				{ provide: ColumnService, useValue: columnServiceMock },
				provideRouter([])
			]
		}).overrideComponent(TaskList, {
			remove: { imports: [TaskElement] },
			add: { imports: [TaskElementStub] }
		}).compileComponents();
	});

	it('should create', async () => {
		await createComponent();

		expect(component).toBeTruthy();
	});

	it('should render tasks', async () => {
		await createComponent();

		const children = fixture.debugElement.queryAll(By.directive(TaskElementStub));

		expect(children).toHaveLength(2);
	});

	it('should render empty message when no task exists', async () => {
		await createComponent();

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
		} as CdkDragDrop<TaskDetailsDto[]>;

		await createComponent();

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
		} as CdkDragDrop<TaskDetailsDto[]>;

		const expectedOrder = [
			{ id: 2, order: 0 },
			{ id: 1, order: 1 }
		];

		await createComponent();

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
		} as CdkDragDrop<TaskDetailsDto[]>;

		columnServiceMock.changeTaskOrder.mockReturnValue(of({}));

		await createComponent(true, true);

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
		} as CdkDragDrop<TaskDetailsDto[]>;

		await createComponent(true, true);

		const emitSpy = vi.spyOn(component.moveTaskToColumn, 'emit');

		component.onMoveTask(dropTaskEvent);

		expect(emitSpy).not.toHaveBeenCalled();
		expect(component.error()).toBeNull();
	});

	it('should emit taskListEdited when TaskElement emits taskDeleted', async () => {
		await createComponent();

		const child = fixture.debugElement
			.query(By.directive(TaskElementStub))
			.componentInstance as TaskElementStub;

		const emitSpy = vi.spyOn(component.taskListEdited, 'emit');

		child.taskDeleted.emit();

		expect(emitSpy).toHaveBeenCalled();
	});

	it('should emit taskListEdited when TaskElement emits taskCommentsEdited', async () => {
		await createComponent();

		const child = fixture.debugElement
			.query(By.directive(TaskElementStub))
			.componentInstance as TaskElementStub;

		const emitSpy = vi.spyOn(component.taskListEdited, 'emit');

		child.taskCommentsEdited.emit();

		expect(emitSpy).toHaveBeenCalled();
	});

	it('should emit taskListEdited when TaskElement emits taskAssigneeEdited', async () => {
		await createComponent();

		const child = fixture.debugElement
			.query(By.directive(TaskElementStub))
			.componentInstance as TaskElementStub;

		const emitSpy = vi.spyOn(component.taskListEdited, 'emit');

		child.taskAssigneeEdited.emit();

		expect(emitSpy).toHaveBeenCalled();
	});
});
