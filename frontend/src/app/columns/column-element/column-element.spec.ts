import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ColumnElement } from './column-element';
import { ActivatedRoute } from '@angular/router';
import { Column, ColumnService } from '../../services/columns/column-service';
import { of } from 'rxjs';
import { Component, output, input } from '@angular/core';
import { Task } from '../../services/tasks/task-service';
import { TaskList } from '../../tasks/task-list/task-list';
import { By } from '@angular/platform-browser';
import { ProjectMemberResponse } from '../../models/project';

@Component({
	selector: 'app-task-list',
	standalone: true,
	template: '',
})
class TaskListStub {
	taskList = input.required<Task[]>();
	projectId = input.required<number>();
	boardId = input.required<number>();
	columnId = input.required<number>();
	memberList = input.required<ProjectMemberResponse[]>();
	filtersActive = input.required<boolean>();

	taskListEdited = output<void>();
	moveTaskToColumn = output<number>();
}

describe('ColumnElement', () => {
	let fixture: ComponentFixture<ColumnElement>;
	let component: ColumnElement;
	let html: HTMLElement;

	const activatedRouteMock = {
		snapshot: {
			paramMap: {
				get: (key: string) => {
					if (key === 'projectId') return '1';
					if (key === 'boardId') return '1';
					if (key == 'columnId') return '1';
					return null;
				}
			}
		}
	};

	let columnServiceMock = { deleteColumn: vi.fn() };

	const column: Column = {
		id: 1,
		name: 'Todo',
		tasks: []
	};

	const projectId = 1;
	const boardId = 1;

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

	async function createComponent(shouldAwait: boolean = true, isFirst = false, isLast = false, filtersActive = false) {
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
		
		fixture.detectChanges();

		if (shouldAwait) {
			await fixture.whenStable();
			fixture.detectChanges();
		}
	}

	beforeEach(async () => {
		vi.clearAllMocks();

		await TestBed.configureTestingModule({
			imports: [ColumnElement],
			providers: [
				{ provide: ColumnService, useValue: columnServiceMock },
				{ provide: ActivatedRoute, useValue: activatedRouteMock }
			]
		}).overrideComponent(ColumnElement, {
			remove: {
				imports: [TaskList],
			},
			add: {
				imports: [TaskListStub],
			},
		})
			.compileComponents();
	});

	it('should create', async () => {
		await createComponent();

		expect(component).toBeTruthy();
	});

	it('should render column information', async () => {
		await createComponent();

		expect(html.textContent).toContain('Todo');
	});

	it('should remove column and emit columnElementEdited when "Delete" button is clicked', async () => {
		columnServiceMock.deleteColumn.mockReturnValue(of({}));

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
