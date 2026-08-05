import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProjectElement } from './project-element';
import { ActivatedRoute } from '@angular/router';
import { ProjectService } from '../../services/projects/project-service';
import { of } from 'rxjs';
import { ProjectResponse } from '../../models/project';

describe('ProjectElement', () => {
	let fixture: ComponentFixture<ProjectElement>;
	let component: ProjectElement;
	let html: HTMLElement;

	const projectServiceMock = { deleteProject: vi.fn() };

	const activatedRouteMock = {
		snapshot: {
			paramMap: {
				get: (key: string) => {
					return null;
				}
			}
		}
	};

	const project: ProjectResponse = {
		id: 1,
		name: 'Project A',
		key: 'PROA',
		description: 'My project',
		members: []
	};

	async function createComponent(shouldAwait: boolean = true) {
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
				{ provide: ActivatedRoute, useValue: activatedRouteMock }
			]
		}).compileComponents();
	});

	it('should create', async () => {
		await createComponent();

		expect(component).toBeTruthy();
	});

	it('should render project information', async () => {
		await createComponent();

		expect(html.textContent).toContain('Project A');
		expect(html.textContent).toContain('PROA');
		expect(html.textContent).toContain('My project');
	});

	it('should delete project and emit projectDeleted on clicking "Delete" button', async () => {
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
