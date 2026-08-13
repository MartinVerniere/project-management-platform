import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProjectDetails } from './project-details';
import { ActivatedRoute } from '@angular/router';
import { ProjectService } from '../../services/projects/project-service';
import { NEVER, of, throwError } from 'rxjs';
import { ProjectDetailsResponse, ProjectMemberResponse } from '../../models/project';
import { Component, input, output } from '@angular/core';
import { BoardResponse } from '../../models/board';
import { UserResponse } from '../../models/user';
import { AuthService } from '../../services/auth/auth-service';
import { MemberList } from '../../members/member-list/member-list';
import { BoardList } from '../../boards/board-list/board-list';
import { By } from '@angular/platform-browser';

@Component({
	selector: 'app-member-list',
	standalone: true,
	template: '',
})
class MemberListStub {
	projectId = input.required<number>();
	memberList = input.required<ProjectMemberResponse[]>();
	hasAdminPermissions = input.required<boolean>();

	memberAdded = output<void>();
	memberRemoved = output<void>();
}

@Component({
	selector: 'app-board-list',
	standalone: true,
	template: '',
})
class BoardListStub {
	projectId = input.required<number>();
	hasAdminPermissions = input.required<boolean>();
}

describe('ProjectDetails', () => {
	let fixture: ComponentFixture<ProjectDetails>;
	let component: ProjectDetails;
	let html: HTMLElement;

	const projectServiceMock = { getProject: vi.fn() };
	const authServiceMock = { user: vi.fn() };

	const activatedRouteMock = {
		snapshot: {
			paramMap: {
				get: () => '1'
			}
		}
	}

	const me: UserResponse = {
		id: 1,
		username: 'john',
		email: 'john@test.com',
		avatarUrl: '/images/default-avatar.png'
	}

	const boards: BoardResponse[] = [
		{
			id: 1,
			name: 'Board A',
			columns: []
		},
		{
			id: 2,
			name: 'Board B',
			columns: []
		},
		{
			id: 3,
			name: 'Board C',
			columns: []
		}
	]

	const members: ProjectMemberResponse[] = [
		{
			id: 1,
			role: 'ADMIN',
			user: me
		},
		{
			id: 2,
			role: 'MEMBER',
			user: {
				id: 2,
				username: 'alice',
				email: 'alice@test.com',
				avatarUrl: '/images/default-avatar.png'
			}
		},
		{
			id: 3,
			role: 'MEMBER',
			user: {
				id: 3,
				username: 'martin',
				email: 'martin@test.com',
				avatarUrl: '/images/default-avatar.png'
			}
		}
	]

	const project: ProjectDetailsResponse = {
		id: 1,
		name: 'Project A',
		key: 'PRA',
		description: 'Description',
		boards: boards,
		members: members
	};

	async function createComponent(shouldAwait: boolean = true) {
		fixture = TestBed.createComponent(ProjectDetails);
		component = fixture.componentInstance;
		html = fixture.nativeElement;

		fixture.detectChanges();

		if (shouldAwait) {
			await fixture.whenStable();
			fixture.detectChanges();
		}
	}

	beforeEach(async () => {
		vi.clearAllMocks();

		await TestBed.configureTestingModule({
			imports: [ProjectDetails],
			providers: [
				{ provide: ProjectService, useValue: projectServiceMock },
				{ provide: AuthService, useValue: authServiceMock },
				{ provide: ActivatedRoute, useValue: activatedRouteMock }
			]
		}).overrideComponent(ProjectDetails, {
			remove: { imports: [MemberList, BoardList] },
			add: { imports: [MemberListStub, BoardListStub] }
		}).compileComponents();
	});

	it('should create', async () => {
		projectServiceMock.getProject.mockReturnValue(of(project));

		await createComponent();

		expect(component).toBeTruthy();
	});

	it('should load project', async () => {
		projectServiceMock.getProject.mockReturnValue(of(project));

		await createComponent();

		expect(projectServiceMock.getProject).toHaveBeenCalledWith(1);
	});

	it('should show loading state', async () => {
		projectServiceMock.getProject.mockReturnValue(NEVER);

		await createComponent(false);

		expect(html.textContent).toContain('Loading...');
	});

	it('should show error state', async () => {
		projectServiceMock.getProject.mockReturnValue(throwError(() => new Error()));

		await createComponent();

		expect(html.textContent).toContain('Error loading project');
	});

	it('should reload project after MemberList emits memberAdded', async () => {
		projectServiceMock.getProject.mockReturnValue(of(project));

		await createComponent();

		const child = fixture.debugElement
			.query(By.directive(MemberListStub))
			.componentInstance as MemberListStub;

		const reloadSpy = vi.spyOn(component.project, 'reload');

		child.memberAdded.emit();

		expect(reloadSpy).toHaveBeenCalled();
	});

	it('should reload project after MemberList emits memberRemoved', async () => {
		projectServiceMock.getProject.mockReturnValue(of(project));

		await createComponent();

		const child = fixture.debugElement
			.query(By.directive(MemberListStub))
			.componentInstance as MemberListStub;

		const reloadSpy = vi.spyOn(component.project, 'reload');

		child.memberRemoved.emit();

		expect(reloadSpy).toHaveBeenCalled();
	});
});
