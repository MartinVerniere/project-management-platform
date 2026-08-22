import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ColumnElement } from './column-element';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { Component, output, input } from '@angular/core';
import { TaskList } from '../../tasks/task-list/task-list';
import { By } from '@angular/platform-browser';
import { ColumnService } from '../../services/columns/column-service';
import type { TaskDetailsDto } from '@shared/models/task';
import type { ProjectMemberDto } from '@shared/models/project';
import type { ColumnDetailsDto } from '@shared/models/column';

@Component({
	selector: 'app-task-list',
	standalone: true,
	template: '',
})
class TaskListStub {
	taskList = input.required<TaskDetailsDto[]>();
	projectId = input.required<number>();
	boardId = input.required<number>();
	columnId = input.required<number>();
	memberList = input.required<ProjectMemberDto[]>();
	filtersActive = input.required<boolean>();
	hasAdminPermissions = input.required<boolean>();

	taskListEdited = output<void>();
	moveTaskToColumn = output<number>();
}

describe('ColumnElement', () => {
	let fixture: ComponentFixture<ColumnElement>;
	let component: ColumnElement;
	let html: HTMLElement;

	let columnServiceMock = { deleteColumn: vi.fn() };

	const projectId = 1;
	const boardId = 1;

	const column: ColumnDetailsDto = {
		id: 1,
		name: 'Todo',
		tasks: [],
		boardId,
		order: 0
	};

	const memberList: ProjectMemberDto[] = [
		{
			id: 1,
			role: 'ADMIN',
			user: {
				id: 1,
				username: 'john',
				email: 'john@example.com',
				avatarUrl: '/images/default-avatar.png'
			}
		},
		{
			id: 2,
			role: 'MEMBER',
			user: {
				id: 3,
				username: 'martin',
				email: 'martin@example.com',
				avatarUrl: '/images/default-avatar.png'
			}
		},
		{
			id: 3,
			role: 'MEMBER',
			user: {
				id: 2,
				username: 'alice',
				email: 'alice@example.com',
				avatarUrl: '/images/default-avatar.png'
			}
		}
	];

	async function createComponent(shouldAwait = true, isFirst = false, isLast = false, filtersActive = false, hasAdminPermissions = true) {
		fixture = TestBed.createComponent(ColumnElement);
		component = fixture.componentInstance;
		html = fixture.nativeElement;

		fixture.componentRef.setInput('column', column);
		fixture.componentRef.setInput('projectId', projectId);
		fixture.componentRef.setInput('boardId', boardId);
		fixture.componentRef.setInput('isFirst', isFirst);
		fixture.componentRef.setInput('isLast', isLast);
		fixture.componentRef.setInput('memberList', memberList);
		fixture.componentRef.setInput('filtersActive', filtersActive);
		fixture.componentRef.setInput('hasAdminPermissions', hasAdminPermissions);

		fixture.detectChanges();

		if (shouldAwait) {
			await fixture.whenStable();
			fixture.detectChanges();
		}
	};

	function setDefaultReturnValues() {
		columnServiceMock.deleteColumn.mockReturnValue(of({}));
	};

	beforeEach(async () => {
		vi.clearAllMocks();

		setDefaultReturnValues();

		await TestBed.configureTestingModule({
			imports: [ColumnElement],
			providers: [
				{ provide: ColumnService, useValue: columnServiceMock },
				provideRouter([])
			]
		}).overrideComponent(ColumnElement, {
			remove: { imports: [TaskList] },
			add: { imports: [TaskListStub] },
		}).compileComponents();
	});

	it('should create', async () => {
		await createComponent();

		expect(component).toBeTruthy();
	});

	it('should render column information', async () => {
		await createComponent();

		expect(html.textContent).toContain('Todo');
	});

	it('should not render "Edit" and "Delete" buttons when user doesnt have admin permissions', async () => {
		await createComponent(true, false, false, false, false);

		const editButton = Array
			.from(html.querySelectorAll('button'))
			.find(button => button.textContent?.includes('Edit'));

		const deleteButton = Array
			.from(html.querySelectorAll('button'))
			.find(button => button.textContent?.includes('Delete'));

		expect(editButton).toBeUndefined();
		expect(deleteButton).toBeUndefined();
	});

	it('should remove column and emit columnElementEdited when "Delete" button is clicked', async () => {
		await createComponent();

		const emitSpy = vi.spyOn(component.columnElementEdited, 'emit');

		const deletColumnButton = Array
			.from(html.querySelectorAll('button'))
			.find(button => button.textContent?.includes('Delete'));

		expect(deletColumnButton).toBeTruthy();

		deletColumnButton!.click();

		await fixture.whenStable();

		expect(columnServiceMock.deleteColumn).toHaveBeenCalledWith(1);
		expect(emitSpy).toHaveBeenCalled();
	});

	it('should emit columnElementEdited when TaskList emits taskListEdited', async () => {
		await createComponent();

		const taskList = fixture.debugElement
			.query(By.directive(TaskListStub))
			.componentInstance as TaskListStub;

		const emitSpy = vi.spyOn(component.columnElementEdited, 'emit');

		taskList.taskListEdited.emit();

		expect(emitSpy).toHaveBeenCalledOnce();
	});

	it('should emit moveTaskToColumn with destination column id when TaskList emits moveTaskToColumn', async () => {
		await createComponent();

		const taskList = fixture.debugElement
			.query(By.directive(TaskListStub))
			.componentInstance as TaskListStub;

		const emitSpy = vi.spyOn(component.moveTaskToColumn, 'emit');

		taskList.moveTaskToColumn.emit(5);

		expect(emitSpy).toHaveBeenCalledWith({ taskId: 5, destinationColumnId: 1 });
	});
});
