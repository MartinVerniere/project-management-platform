import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TaskElement } from './task-element';
import { ActivatedRoute } from '@angular/router';
import { of, throwError } from 'rxjs';
import { Component, input, output } from '@angular/core';
import { CommentList } from '../../comments/comment-list/comment-list';
import { By } from '@angular/platform-browser';
import { ProjectMemberResponse } from '../../models/project';
import { TaskResponse } from '../../models/task';
import { TaskService } from '../../services/tasks/task-service';
import { UserResponse } from '../../models/user';

@Component({
	selector: 'app-comment-list',
	standalone: true,
	template: '',
})
class CommentListStub {
	commentList = input.required<Comment[]>();
	taskId = input.required<number>();
	hasAdminPermissions = input.required<boolean>();

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

	let taskServiceMock = {
		deleteTask: vi.fn(),
		assignTask: vi.fn(),
		unassignTask: vi.fn()
	};

	const me: UserResponse = {
		id: 1,
		username: 'john',
		email: 'john@test.com',
		avatarUrl: '/images/default-avatar.png'
	}

	const task: TaskResponse = {
		id: 1,
		title: 'Task A',
		description: 'Description',
		comments: [
			{
				id: 1,
				content: 'Good',
				user: me
			},
			{
				id: 2,
				content: 'Great',
				user: me
			}
		]
	};

	const projectId = 1;
	const boardId = 1;
	const columnId = 1;

	const memberList: ProjectMemberResponse[] = [
		{
			id: 1,
			role: 'ADMIN',
			user: me
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

	async function createComponent(shouldAwait = true, hasAdminPermissions = true) {
		fixture = TestBed.createComponent(TaskElement);
		component = fixture.componentInstance;
		html = fixture.nativeElement;

		fixture.componentRef.setInput('task', task);
		fixture.componentRef.setInput('projectId', projectId);
		fixture.componentRef.setInput('boardId', boardId);
		fixture.componentRef.setInput('columnId', columnId);
		fixture.componentRef.setInput('memberList', memberList);
		fixture.componentRef.setInput('hasAdminPermissions', hasAdminPermissions);

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
			remove: { imports: [CommentList] },
			add: { imports: [CommentListStub] }
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

	it('should not render "Change" assignee button when user doesnt have admin permissions', async () => {
		await createComponent(true, false);

		const changeButton = Array
			.from(html.querySelectorAll('button'))
			.find(button => button.textContent?.includes('Change'));

		expect(changeButton).toBeUndefined();
	});

	it('should remove task and emit taskRemoved when "Delete" button is clicked', async () => {
		taskServiceMock.deleteTask.mockReturnValue(of({}));

		await createComponent();

		const emitSpy = vi.spyOn(component.taskDeleted, 'emit');

		const deleteButton = Array
			.from(html.querySelectorAll('button'))
			.find(button => button.textContent?.includes('Delete'));

		expect(deleteButton).toBeTruthy();

		deleteButton!.click();

		await fixture.whenStable();

		expect(taskServiceMock.deleteTask).toHaveBeenCalledWith(1);
		expect(emitSpy).toHaveBeenCalled();
	});

	it('should enable assignee form when changing assignee', async () => {
		await createComponent();

		const enableAssigneeFormButton = Array
			.from(html.querySelectorAll('button'))
			.find(button => button.textContent?.includes('Change'));

		expect(enableAssigneeFormButton).toBeTruthy();

		enableAssigneeFormButton!.click();

		await fixture.whenStable();

		expect(component.assigneeFormEnabled()).toBe(true);
	});

	it('should set selected assignee when a member is selected', async () => {
		await createComponent();

		const event = { target: { value: '2' } } as unknown as Event;

		component.onAssigneeChanged(event);

		expect(component.selectedAssigneeId()).toBe(2);
	});

	it('should set selected assignee to null when none is selected', async () => {
		await createComponent();

		const event = { target: { value: 'null' } } as unknown as Event;

		component.onAssigneeChanged(event);

		expect(component.selectedAssigneeId()).toBeNull();
	});

	it('should assign task to selected user, emit taskAssigneeEdited and hide form when request succeeds', async () => {
		taskServiceMock.assignTask.mockReturnValue(of({}));

		await createComponent();

		component.selectedAssigneeId.set(2);

		const emitSpy = vi.spyOn(component.taskAssigneeEdited, 'emit');

		component.onSetAssignee();

		expect(taskServiceMock.assignTask).toHaveBeenCalledWith(1, 2);
		expect(emitSpy).toHaveBeenCalled();
		expect(component.assigneeFormEnabled()).toBe(false);
		expect(component.selectedAssigneeId()).toBeNull();
		expect(component.error()).toBeNull();
	});

	it('should unassign task, emit taskAssigneeEdited and hide form when no assignee is selected', async () => {
		taskServiceMock.unassignTask.mockReturnValue(of({}));

		await createComponent();

		component.selectedAssigneeId.set(null);

		const emitSpy = vi.spyOn(component.taskAssigneeEdited, 'emit');

		component.onSetAssignee();

		expect(taskServiceMock.unassignTask).toHaveBeenCalledWith(1);
		expect(emitSpy).toHaveBeenCalled();
		expect(component.assigneeFormEnabled()).toBe(false);
		expect(component.error()).toBeNull();
	});

	it('should not emit taskAssigneeEdited and set error when request fails', async () => {
		taskServiceMock.assignTask.mockReturnValue(throwError(() => ({
			error: {
				error: {
					code: 'ERROR_MESSAGE',
					message: 'Error message'
				}
			}
		})));

		await createComponent();

		component.selectedAssigneeId.set(2);

		const emitSpy = vi.spyOn(component.taskAssigneeEdited, 'emit');

		component.onSetAssignee();

		expect(taskServiceMock.assignTask).toHaveBeenCalledWith(1, 2);
		expect(emitSpy).not.toHaveBeenCalled();
		expect(component.error()).not.toBeNull();
	});

	it('should disable assignee form and clear selected assignee when form cancelled', async () => {
		await createComponent();

		component.selectedAssigneeId.set(2);
		component.assigneeFormEnabled.set(true);

		await fixture.whenStable();

		const cancelAssigneeFormButton = Array
			.from(html.querySelectorAll('button'))
			.find(button => button.textContent?.includes('Cancel'));

		expect(cancelAssigneeFormButton).toBeTruthy();

		cancelAssigneeFormButton!.click();

		await fixture.whenStable();

		expect(component.assigneeFormEnabled()).toBe(false);
		expect(component.selectedAssigneeId()).toBeNull();
	});

	it('should emit taskCommentsEdited when CommentList emits commentListEdited', async () => {
		await createComponent();

		const child = fixture.debugElement
			.query(By.directive(CommentListStub))
			.componentInstance as CommentListStub;

		const emitSpy = vi.spyOn(component.taskCommentsEdited, 'emit');

		child.commentListEdited.emit();

		expect(emitSpy).toHaveBeenCalled();
	});
});
