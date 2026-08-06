import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProjectDetails } from './project-details';
import { ActivatedRoute } from '@angular/router';
import { ProjectService } from '../../services/projects/project-service';
import { NEVER, of, throwError } from 'rxjs';
import { ProjectDetailsResponse } from '../../models/project';

describe('ProjectDetails', () => {
	let fixture: ComponentFixture<ProjectDetails>;
	let component: ProjectDetails;
	let html: HTMLElement;

	const projectServiceMock = { getProject: vi.fn() };

	const activatedRouteMock = {
		snapshot: {
			paramMap: {
				get: () => '1'
			}
		}
	}

	const project: ProjectDetailsResponse = {
		id: 1,
		name: 'Project A',
		key: 'PRA',
		description: 'Description',
		boards: [],
		members: []
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
				{ provide: ActivatedRoute, useValue: activatedRouteMock }
			]
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

	it('should reload project after member added', async () => {
		projectServiceMock.getProject.mockReturnValue(of(project));

		await createComponent();

		const reloadSpy = vi.spyOn(component.project, 'reload');

		await component.onMemberAdded();

		expect(reloadSpy).toHaveBeenCalled();
	});

	it('should reload project after member removed', async () => {
		projectServiceMock.getProject.mockReturnValue(of(project));
		
		await createComponent();

		const reloadSpy = vi.spyOn(component.project, 'reload');

		await component.onMemberRemoved();

		expect(reloadSpy).toHaveBeenCalled();
	});
});
