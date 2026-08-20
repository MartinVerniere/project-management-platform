import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NEVER, of, throwError } from 'rxjs';

import { ProjectList } from './project-list';
import { ProjectService } from '../../services/projects/project-service';
import { ActivatedRoute } from '@angular/router';
import { Component, input, output } from '@angular/core';
import { ProjectElement } from '../project-element/project-element';
import { By } from '@angular/platform-browser';
import type { ProjectDto } from '@shared/models/project';

@Component({
	selector: 'app-project-element',
	standalone: true,
	template: '',
})
class ProjectElementStub {
	project = input.required<ProjectDto>();

	projectDeleted = output<void>();
}

describe('ProjectList', () => {
	let fixture: ComponentFixture<ProjectList>;
	let component: ProjectList;
	let html: HTMLElement;

	const projectServiceMock = { getProjects: vi.fn() };

	const activatedRouteMock = {
		snapshot: {
			paramMap: {
				get: (key: string) => {
					return null;
				}
			}
		}
	}

	const projects: ProjectDto[] = [
		{
			id: 1,
			name: 'Project A',
			key: 'PROA',
			description: null,
		},
		{
			id: 2,
			name: 'Project B',
			key: 'PROB',
			description: null,
		}
	];

	async function createComponent(shouldAwait: boolean = true) {
		fixture = TestBed.createComponent(ProjectList);
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
			imports: [ProjectList],
			providers: [
				{ provide: ProjectService, useValue: projectServiceMock },
				{ provide: ActivatedRoute, useValue: activatedRouteMock } // Need to inject this apparently because of RouterLink
			]
		}).overrideComponent(ProjectList, {
			remove: {
				imports: [ProjectElement],
			},
			add: {
				imports: [ProjectElementStub],
			}
		}).compileComponents();
	});

	it('should create', async () => {
		projectServiceMock.getProjects.mockReturnValue(of(projects));

		await createComponent();

		expect(component).toBeTruthy();
	});

	it('should show loading state', async () => {
		projectServiceMock.getProjects.mockReturnValue(NEVER);

		await createComponent(false);

		expect(html.textContent).toContain('Loading...');
	});

	it('should render projects', async () => {
		projectServiceMock.getProjects.mockReturnValue(of(projects));

		await createComponent();

		const children = fixture.debugElement.queryAll(By.directive(ProjectElementStub));

		expect(children).toHaveLength(2);
	});

	it('should show empty state', async () => {
		projectServiceMock.getProjects.mockReturnValue(of([]));

		await createComponent();

		expect(html.textContent).toContain('No projects yet.');
	});

	it('should show error state', async () => {
		projectServiceMock.getProjects.mockReturnValue(throwError(() => new Error()));

		await createComponent();

		expect(html.textContent).toContain('Error loading projects');
	});

	it('should reload project list when project is deleted', async () => {
		projectServiceMock.getProjects.mockReturnValue(of(projects));

		await createComponent();

		const child = fixture.debugElement
			.query(By.directive(ProjectElementStub))
			.componentInstance as ProjectElementStub;

		const reloadSpy = vi.spyOn(component.projectList, 'reload');

		child.projectDeleted.emit();

		expect(reloadSpy).toHaveBeenCalled();
	});
});