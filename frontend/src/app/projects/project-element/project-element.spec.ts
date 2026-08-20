import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProjectElement } from './project-element';
import { ActivatedRoute } from '@angular/router';
import { ProjectService } from '../../services/projects/project-service';
import { of } from 'rxjs';
import { AuthService } from '../../services/auth/auth-service';
import { UserDto } from '@shared/models/user';
import { ProjectDto, ProjectMemberDto } from '@shared/models/project';

describe('ProjectElement', () => {
	let fixture: ComponentFixture<ProjectElement>;
	let component: ProjectElement;
	let html: HTMLElement;

	const projectServiceMock = {
		deleteProject: vi.fn(),
		getMembers: vi.fn()
	};

	const authServiceMock = { user: vi.fn() };

	const activatedRouteMock = {
		snapshot: {
			paramMap: {
				get: (key: string) => {
					return null;
				}
			}
		}
	};

	const me: UserDto = {
		id: 1,
		username: 'john',
		email: 'john@test.com',
		avatarUrl: '/images/default-avatar.png'
	}

	const project: ProjectDto = {
		id: 1,
		name: 'Project A',
		key: 'PROA',
		description: 'My project',
	};

	const members: ProjectMemberDto[] = [
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
	];

	async function createComponent(shouldAwait = true) {
		fixture = TestBed.createComponent(ProjectElement);
		component = fixture.componentInstance;
		html = fixture.nativeElement;

		fixture.componentRef.setInput('project', project);

		fixture.detectChanges();

		if (shouldAwait) {
			await fixture.whenStable();
			fixture.detectChanges();
		}
	}

	beforeEach(async () => {
		vi.clearAllMocks();

		await TestBed.configureTestingModule({
			imports: [ProjectElement],
			providers: [
				{ provide: ProjectService, useValue: projectServiceMock },
				{ provide: AuthService, useValue: authServiceMock },
				{ provide: ActivatedRoute, useValue: activatedRouteMock }
			]
		}).compileComponents();
	});

	it('should create', async () => {
		projectServiceMock.getMembers.mockReturnValue(of(members));

		await createComponent();

		expect(component).toBeTruthy();
	});

	it('should fetch project members', async () => {
		projectServiceMock.getMembers.mockReturnValue(of(members));

		await createComponent();

		expect(projectServiceMock.getMembers).toHaveBeenCalledWith(project.id);
	});

	it('should render project information', async () => {
		projectServiceMock.getMembers.mockReturnValue(of(members));
	
		await createComponent();
	
		expect(html.textContent).toContain('Project A');
		expect(html.textContent).toContain('PROA');
		expect(html.textContent).toContain('My project');
	});

	it('should not render "Delete" button if user doesnt have delete permissions', async () => {
		projectServiceMock.getMembers.mockReturnValue(of(members));
		authServiceMock.user.mockReturnValue({
			id: 2,
			username: 'alice',
			email: 'alice@test.com',
			avatarUrl: '/images/default-avatar.png'
		});

		await createComponent();

		const deleteButton = Array
			.from(html.querySelectorAll('button'))
			.find(button => button.textContent?.includes('Delete'));

		expect(deleteButton).toBeUndefined();
	});

	it('should delete project and emit projectDeleted on clicking "Delete" button', async () => {
		projectServiceMock.getMembers.mockReturnValue(of(members));
		authServiceMock.user.mockReturnValue(me);
		projectServiceMock.deleteProject.mockReturnValue(of({}));

		await createComponent();

		const emitSpy = vi.spyOn(component.projectDeleted, 'emit');

		const deleteButton = Array
			.from(html.querySelectorAll('button'))
			.find(button => button.textContent?.includes('Delete'));

		expect(deleteButton).toBeTruthy();

		deleteButton!.click();

		await fixture.whenStable();

		expect(projectServiceMock.deleteProject).toHaveBeenCalledWith(1);
		expect(emitSpy).toHaveBeenCalled();
	});
});
