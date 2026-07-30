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

@Component({
	selector: 'app-column-element',
	standalone: true,
	template: '',
})
class ColumnElementStub {
	column = input.required<Column>();
	projectId = input.required<number>();
	boardId = input.required<number>();

	isFirst = input<boolean>();
	isLast = input<boolean>();

	columnElementEdited = output<void>();
	moveLeft = output<number>();
	moveRight = output<number>();
	moveTaskToColumn = output<{ taskId: number; destinationColumnId: number; }>();
}

describe('ColumnList', () => {
	let fixture: ComponentFixture<ColumnList>;
	let component: ColumnList;
	let html: HTMLElement;

	const boardServiceMock = { changeColumnOrder: vi.fn() };
	const taskServiceMock = { moveTask: vi.fn() };

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

	it('should render columns', async () => {
		await createComponent(true, columnList);

		const children = fixture.debugElement.queryAll(By.directive(ColumnElementStub));

		expect(children).toHaveLength(2);
	});

	it('should render empty message when no column exists', async () => {
		await createComponent(true);

		expect(html.textContent).toContain('No columns in this project');
	});

	it('should change column order when column is moved left and emit columnListEdited', async () => {
		const expectedOrder = [
			{ id: 2, order: 0 },
			{ id: 1, order: 1 },
		];

		boardServiceMock.changeColumnOrder.mockReturnValue(of({}));

		await createComponent(true, columnList);

		const emitSpy = vi.spyOn(component.columnListEdited, 'emit');

		component.onMoveLeft(2);

		expect(boardServiceMock.changeColumnOrder).toHaveBeenCalledWith(1, { columnOrder: expectedOrder });
		expect(emitSpy).toHaveBeenCalled();
		expect(component.error()).toBeNull();
	});

	it('should change column order when column is moved right and emit columnListEdited', async () => {
		const expectedOrder = [
			{ id: 2, order: 0 },
			{ id: 1, order: 1 },
		];

		boardServiceMock.changeColumnOrder.mockReturnValue(of({}));

		await createComponent(true, columnList);

		const emitSpy = vi.spyOn(component.columnListEdited, 'emit');

		component.onMoveRight(1);

		expect(boardServiceMock.changeColumnOrder).toHaveBeenCalledWith(1, { columnOrder: expectedOrder });
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
