import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TaskElement } from './task-element';
import { Task, TaskService } from '../../services/tasks/task-service';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';
import { Component, input, output } from '@angular/core';
import { CommentList } from '../../comments/comment-list/comment-list';
import { By } from '@angular/platform-browser';

@Component({
	selector: 'app-comment-list',
	standalone: true,
	template: '',
})
class CommentListStub {
	commentList = input.required<Comment[]>();
	taskId = input.required<number>();

	commentListEdited = output<void>();
}

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
		description: 'Description',
		comments: [
			{
				id: 1,
				content: 'Good',
				user: {
					id: 1,
					username: 'john'
				}
			},
			{
				id: 2,
				content: 'Great',
				user: {
					id: 1,
					username: 'john'
				}
			}
		]
	};

	const projectId = 1;
	const boardId = 1;
	const columnId = 1;

	async function createComponent(shouldAwait: boolean = true) {
		fixture = TestBed.createComponent(TaskElement);
		component = fixture.componentInstance;
		html = fixture.nativeElement;

		fixture.componentRef.setInput('task', task);
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
			imports: [TaskElement],
			providers: [
				{ provide: TaskService, useValue: taskServiceMock },
				{ provide: ActivatedRoute, useValue: activatedRouteMock }
			]
		}).overrideComponent(TaskElement, {
			remove: {
				imports: [CommentList],
			},
			add: {
				imports: [CommentListStub],
			}
		}).compileComponents();
	});

	it('should create', async () => {
		await createComponent();

		expect(component).toBeTruthy();
	});

	it('should render task information', async () => {
		await createComponent();

		const children = fixture.debugElement.queryAll(By.directive(CommentListStub));

		expect(html.textContent).toContain('Task A');
		expect(children).toHaveLength(1);
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

	it('should emit taskCommentsEdited CommentList emits commentListEdited', async () => {
		await createComponent();

		const child = fixture.debugElement
			.query(By.directive(CommentListStub))
			.componentInstance as CommentListStub;

		const emitSpy = vi.spyOn(component.taskCommentsEdited, 'emit');

		child.commentListEdited.emit();

		expect(emitSpy).toHaveBeenCalled();
	});
});
