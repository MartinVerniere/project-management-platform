import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ColumnList } from './column-list';
import { BoardService } from '../../services/boards/board-service';
import { ActivatedRoute } from '@angular/router';
import { Column } from '../../services/columns/column-service';
import { of, throwError } from 'rxjs';
import { Component, input, output } from '@angular/core';
import { ColumnElement } from '../column-element/column-element';
import { By } from '@angular/platform-browser';
import { TaskService } from '../../services/tasks/task-service';
import { CdkDragDrop } from '@angular/cdk/drag-drop';
import { ProjectService } from '../../services/projects/project-service';
import { ProjectMemberResponse } from '../../models/project';

@Component({
	selector: 'app-column-element',
	standalone: true,
	template: '',
})
class ColumnElementStub {
	column = input.required<Column>();
	projectId = input.required<number>();
	boardId = input.required<number>();
	memberList = input.required<ProjectMemberResponse[]>();
	filtersActive = input.required<boolean>();

	isFirst = input<boolean>();
	isLast = input<boolean>();

	columnElementEdited = output<void>();
	moveTaskToColumn = output<{ taskId: number; destinationColumnId: number; }>();
}

describe('ColumnList', () => {
	let fixture: ComponentFixture<ColumnList>;
	let component: ColumnList;
	let html: HTMLElement;

	const boardServiceMock = { changeColumnOrder: vi.fn() };
	const taskServiceMock = { moveTask: vi.fn() };
	const projectServiceMock = { getMembers: vi.fn().mockReturnValue(of([])) };

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

	const columnList: Column[] = [
		{
			id: 1, name: "Column A",
			tasks: [
				{
					id: 1,
					title: 'Task A',
					comments: []
				}
			]
		},
		{ id: 2, name: "Column B", tasks: [] }
	];

	const projectId = 1;
	const boardId = 1;

	async function createComponent(shouldAwait: boolean = true, columnList: Column[] = []) {
		fixture = TestBed.createComponent(ColumnList);
		component = fixture.componentInstance;
		html = fixture.nativeElement;

		fixture.componentRef.setInput('columnList', columnList);
		fixture.componentRef.setInput('projectId', projectId);
		fixture.componentRef.setInput('boardId', boardId);

		fixture.detectChanges();

		if (shouldAwait) {
			await fixture.whenStable();
			fixture.detectChanges();
		}
	}

	beforeEach(async () => {
		vi.clearAllMocks();

		await TestBed.configureTestingModule({
			imports: [ColumnList],
			providers: [
				{ provide: BoardService, useValue: boardServiceMock },
				{ provide: TaskService, useValue: taskServiceMock },
				{ provide: ActivatedRoute, useValue: activatedRouteMock },
				{ provide: ProjectService, useValue: projectServiceMock }
			]
		}).overrideComponent(ColumnList, {
			remove: {
				imports: [ColumnElement],
			},
			add: {
				imports: [ColumnElementStub],
			}
		}).compileComponents();
	});

	it('should create', async () => {
		await createComponent(true, columnList);

		expect(component).toBeTruthy();
	});

	it('should fetch project members', async () => {
		projectServiceMock.getMembers.mockReturnValue(of([]));

		await createComponent(true, columnList);

		expect(projectServiceMock.getMembers).toHaveBeenCalledWith(projectId);
	});

	it('should render columns', async () => {
		await createComponent(true, columnList);

		const children = fixture.debugElement.queryAll(By.directive(ColumnElementStub));

		expect(children).toHaveLength(2);
	});

	it('should render empty message when no column exists', async () => {
		await createComponent(true);

		expect(html.textContent).toContain('No columns in this project');
	});

	it('should update searchTerm when search input changes', async () => {
		await createComponent(true, columnList);

		const event = { target: { value: 'search term' } } as unknown as Event;
		component.onSearchChange(event);

		expect(component.searchTerm()).toBe('search term');
	});

	it('should filter tasks by search term', async () => {
		await createComponent(true, [
			{
				id: 1,
				name: 'Todo',
				tasks: [
					{ id: 1, title: 'Login', comments: [] },
					{ id: 2, title: 'Dashboard', comments: [] }
				]
			}
		]);

		component.searchTerm.set('log');

		expect(component.filteredColumnList()[0].tasks).toHaveLength(1);
		expect(component.filteredColumnList()[0].tasks[0].title).toBe('Login');
	});

	it('should filter tasks by assignee', async () => {
		await createComponent(true, [
			{
				id: 1,
				name: 'Todo',
				tasks: [
					{
						id: 1,
						title: 'Login',
						assignee: {
							id: 1, 
							username: 'john',
							email: 'john@example.com'
						},
						comments: []
					},
					{
						id: 2,
						title: 'Dashboard',
						assignee: {
							id: 2, 
							username: 'mary',
							email: 'mary@example.com'
						},
						comments: []
					}
				]
			}
		]);

		component.selectedAssigneeId.set(2);

		expect(component.filteredColumnList()[0].tasks).toHaveLength(1);
		expect(component.filteredColumnList()[0].tasks[0].title).toBe('Dashboard');
	});

	it('should set filtersActive to true when searchTerm is set', async () => {
		await createComponent(true, columnList);

		component.searchTerm.set('abc');
		expect(component.filtersActive()).toBe(true);
	});

	it('should set filtersActive to true when selectedAssigneeId is set', async () => {
		await createComponent(true, columnList);

		component.selectedAssigneeId.set(2);
		expect(component.filtersActive()).toBe(true);
	});

	it('should update selectedAssigneeId when assignee changes', async () => {
		await createComponent(true, columnList);

		const event = { target: { value: '2' } } as unknown as Event;
		component.onAssigneeChange(event);

		expect(component.selectedAssigneeId()).toBe(2);
	});

	it('should set selectedAssigneeId to null when assignee value is empty', async () => {
		await createComponent(true, columnList);

		component.selectedAssigneeId.set(2);

		const event = { target: { value: '' } } as unknown as Event;
		component.onAssigneeChange(event);

		expect(component.selectedAssigneeId()).toBeNull();
	});

	it('should clear filters when "Clear filters" is selected', async () => {
		await createComponent(true, columnList);

		const event = { target: { value: 'search term' } } as unknown as Event;
		component.onSearchChange(event);

		const secondEvent = { target: { value: '2' } } as unknown as Event;
		component.onAssigneeChange(secondEvent);

		component.clearFilters();

		expect(component.selectedAssigneeId()).toBeNull();
		expect(component.searchTerm()).toBe('');
	});

	it('should change column order when column was dragged inside the column list to a different position and emit columnListEdited', async () => {
		const container = {};

		const dropColumnEvent = {
			item: { data: { type: 'column', column: columnList[1] } },
			previousContainer: container,
			container: container,
			previousIndex: 1,
			currentIndex: 0
		} as CdkDragDrop<Column[]>;

		const expectedOrder = [
			{ id: 2, order: 0 },
			{ id: 1, order: 1 }
		];

		boardServiceMock.changeColumnOrder.mockReturnValue(of({}));

		await createComponent(true, columnList);

		const emitSpy = vi.spyOn(component.columnListEdited, 'emit');

		component.onMoveColumn(dropColumnEvent);

		expect(boardServiceMock.changeColumnOrder).toHaveBeenCalledWith(boardId, { columnOrder: expectedOrder });
		expect(emitSpy).toHaveBeenCalled();
		expect(component.error()).toBeNull();
	});

	it('should move task to destination column when task is dragged and emit columnListEdited', async () => {
		taskServiceMock.moveTask.mockReturnValue(of({}));

		await createComponent(true, columnList);

		const emitSpy = vi.spyOn(component.columnListEdited, 'emit');

		const children = fixture.debugElement.queryAll(By.directive(ColumnElementStub));
		const secondColumn = children[1].componentInstance as ColumnElementStub;

		secondColumn.moveTaskToColumn.emit({ taskId: 1, destinationColumnId: 2 });

		expect(taskServiceMock.moveTask).toHaveBeenCalledWith(1, 2);
		expect(emitSpy).toHaveBeenCalled();
	});

	it('should not move task to destination column when dragging action fails', async () => {
		taskServiceMock.moveTask.mockReturnValue(throwError(() => ({
			error: {
				error: {
					code: 'ERROR_MESSAGE',
					message: 'Error message'
				}
			}
		})));

		await createComponent(true, columnList);

		const emitSpy = vi.spyOn(component.columnListEdited, 'emit');

		const children = fixture.debugElement.queryAll(By.directive(ColumnElementStub));
		const secondColumn = children[1].componentInstance as ColumnElementStub;

		secondColumn.moveTaskToColumn.emit({ taskId: 1, destinationColumnId: 2 });

		expect(taskServiceMock.moveTask).toHaveBeenCalledWith(1, 2);
		expect(emitSpy).not.toHaveBeenCalled();
		expect(component.error()).not.toBe(null);
	});

	it('should emit columnListEdited when one of the ColumnElement emits columnElementEdited', async () => {
		await createComponent(true, columnList);

		const child = fixture.debugElement
			.query(By.directive(ColumnElementStub))
			.componentInstance as ColumnElementStub;

		const emitSpy = vi.spyOn(component.columnListEdited, 'emit');

		child.columnElementEdited.emit();

		expect(emitSpy).toHaveBeenCalled();
	});
});
