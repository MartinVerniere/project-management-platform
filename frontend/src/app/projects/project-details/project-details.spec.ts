import { TestBed } from '@angular/core/testing';
import { ProjectDetails } from './project-details';
import { provideRouter } from '@angular/router';
import { ProjectService } from '../../services/projects/project-service';
import { NEVER, of, throwError } from 'rxjs';
import { Component, input, output } from '@angular/core';
import { AuthService } from '../../services/auth/auth-service';
import { MemberList } from '../../members/member-list/member-list';
import { BoardList } from '../../boards/board-list/board-list';
import { By } from '@angular/platform-browser';
import { ProjectDetailsDto, ProjectMemberDto } from '@shared/models/project';
import type { UserDto } from '@shared/models/user';
import type { BoardDto } from '@shared/models/board';
import { RouterTestingHarness } from '@angular/router/testing';

@Component({
	selector: 'app-member-list',
	standalone: true,
	template: '',
})
class MemberListStub {
	projectId = input.required<number>();
	memberList = input.required<ProjectMemberDto[]>();
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
	let component: ProjectDetails;
	let harness: RouterTestingHarness;
	let html: HTMLElement;

	const projectServiceMock = { getProject: vi.fn() };
	const authServiceMock = { user: vi.fn() };

	const me: UserDto = { id: 1, username: 'john', email: 'john@test.com', avatarUrl: '/images/default-avatar.png' };

	const boards: BoardDto[] = [
		{ id: 1, name: 'Board A', projectId: 1 },
		{ id: 2, name: 'Board B', projectId: 1 },
		{ id: 3, name: 'Board C', projectId: 1 }
	];

	const members: ProjectMemberDto[] = [
		{
			id: 1,
			role: 'ADMIN',
			user: me
		},
		{
			id: 2,
			role: 'MEMBER',
			user: { id: 2, username: 'alice', email: 'alice@test.com', avatarUrl: '/images/default-avatar.png' }
		},
		{
			id: 3,
			role: 'MEMBER',
			user: { id: 3, username: 'martin', email: 'martin@test.com', avatarUrl: '/images/default-avatar.png' }
		}
	];

	const project: ProjectDetailsDto = {
		id: 1,
		name: 'Project A',
		key: 'PRA',
		description: 'Description',
		boards: boards,
		members: members
	};

	async function createComponent(shouldAwait: boolean = true) {
		component = await harness.navigateByUrl('/projects/1', ProjectDetails);
		html = harness.routeNativeElement!;

		if (shouldAwait) {
			await harness.fixture.whenStable();
			harness.detectChanges();
		};
	};

	function setDefaultReturnValues() {
		projectServiceMock.getProject.mockReturnValue(of(project));
		authServiceMock.user.mockReturnValue(me);
	};

	async function setHarnessAndRouter() {
		harness = await RouterTestingHarness.create();
		// router = TestBed.inject(Router);
	};

	beforeEach(async () => {
		vi.clearAllMocks();

		setDefaultReturnValues();

		await TestBed.configureTestingModule({
			imports: [ProjectDetails],
			providers: [
				{ provide: ProjectService, useValue: projectServiceMock },
				{ provide: AuthService, useValue: authServiceMock },
				provideRouter([
					{
						path: 'projects/:id',
						component: ProjectDetails,
					},
				]),
			]
		}).overrideComponent(ProjectDetails, {
			remove: { imports: [MemberList, BoardList] },
			add: { imports: [MemberListStub, BoardListStub] }
		}).compileComponents();

		await setHarnessAndRouter();
	});

	it('should create', async () => {
		await createComponent();

		expect(component).toBeTruthy();
	});

	it('should load project', async () => {
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
		await createComponent();

		const child = harness.routeDebugElement!
			.query(By.directive(MemberListStub))
			.componentInstance as MemberListStub;

		const reloadSpy = vi.spyOn(component.project, 'reload');

		child.memberAdded.emit();

		expect(reloadSpy).toHaveBeenCalled();
	});

	it('should reload project after MemberList emits memberRemoved', async () => {
		await createComponent();

		const child = harness.routeDebugElement!
			.query(By.directive(MemberListStub))
			.componentInstance as MemberListStub;

		const reloadSpy = vi.spyOn(component.project, 'reload');

		child.memberRemoved.emit();

		expect(reloadSpy).toHaveBeenCalled();
	});
});
