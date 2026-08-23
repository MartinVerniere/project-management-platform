import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ProjectElement } from './project-element';
import { provideRouter } from '@angular/router';
import { ProjectService } from '../../services/projects/project-service';
import { of } from 'rxjs';
import { AuthService } from '../../services/auth/auth-service';
import type { UserDto } from '@shared/models/user';
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

	const me: UserDto = { id: 1, username: 'john', email: 'john@test.com', avatarUrl: '/images/default-avatar.png' };

	const project: ProjectDto = { id: 1, name: 'Project A', key: 'PROA', description: 'My project' };

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

	async function createComponent(shouldAwait = true) {
		fixture = TestBed.createComponent(ProjectElement);
		component = fixture.componentInstance;
		html = fixture.nativeElement;

		fixture.componentRef.setInput('project', project);

		fixture.detectChanges();

		if (shouldAwait) {
			await fixture.whenStable();
			fixture.detectChanges();
		};
	};

	function setDefaultReturnValues() {
		authServiceMock.user.mockReturnValue(me);
		projectServiceMock.getMembers.mockReturnValue(of(members));
		projectServiceMock.deleteProject.mockReturnValue(of({}));
	};

	beforeEach(async () => {
		vi.clearAllMocks();

		setDefaultReturnValues();

		await TestBed.configureTestingModule({
			imports: [ProjectElement],
			providers: [
				{ provide: ProjectService, useValue: projectServiceMock },
				{ provide: AuthService, useValue: authServiceMock },
				provideRouter([]),
			]
		}).compileComponents();
	});

	it('should create', async () => {
		await createComponent();

		expect(component).toBeTruthy();
	});

	it('should fetch project members', async () => {
		await createComponent();

		expect(projectServiceMock.getMembers).toHaveBeenCalledWith(project.id);
	});

	it('should render project information', async () => {
		await createComponent();

		expect(html.textContent).toContain('Project A');
		expect(html.textContent).toContain('PROA');
		expect(html.textContent).toContain('My project');
	});

	it('should not render "Delete" button if user doesnt have delete permissions', async () => {
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
