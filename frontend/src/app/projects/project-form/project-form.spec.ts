import { TestBed } from '@angular/core/testing';
import { ProjectForm } from './project-form';
import { provideRouter, Router } from '@angular/router';
import { ProjectService } from '../../services/projects/project-service';
import { of } from 'rxjs';
import { Component } from '@angular/core';
import { RouterTestingHarness } from '@angular/router/testing';

@Component({
	standalone: true,
	template: '',
})
class DummyComponent { }

describe('ProjectForm', () => {
	let component: ProjectForm;
	let harness: RouterTestingHarness;
	let router: Router;

	let projectServiceMock = { createProject: vi.fn() };

	async function createComponent(shouldAwait: boolean = true) {
		component = await harness.navigateByUrl('/projects/create', ProjectForm);

		if (shouldAwait) {
			await harness.fixture.whenStable();
			harness.detectChanges();
		}
	}

	function setDefaultReturnValues() {
		projectServiceMock.createProject.mockReturnValue(of({}));
	}

	beforeEach(async () => {
		vi.clearAllMocks();

		setDefaultReturnValues();

		await TestBed.configureTestingModule({
			imports: [ProjectForm],
			providers: [
				{ provide: ProjectService, useValue: projectServiceMock },
				provideRouter([
					{ path: 'projects/create', component: ProjectForm, },
					{ path: 'projects', component: DummyComponent, },
				]),
			]
		}).compileComponents();

		harness = await RouterTestingHarness.create();
		router = TestBed.inject(Router);
	});

	it('should create', async () => {
		await createComponent();

		expect(component).toBeTruthy();
	});

	it('should create project when valid form data, then redirect to /projects and clear form', async () => {
		projectServiceMock.createProject.mockReturnValue(of({}));

		await createComponent();

		component.projectModel.set({
			name: 'Project A',
			key: 'PRO',
			description: ''
		});

		await component.onSubmit(new Event('submit'));

		await harness.fixture.whenStable();
		harness.detectChanges();

		expect(projectServiceMock.createProject).toHaveBeenCalledWith({ name: 'Project A', key: 'PRO', description: '' });
		expect(component.projectModel()).toEqual({ name: '', key: '', description: '' });
		expect(router.url).toBe('/projects');
	});

	it('should not create project when invalid form data', async () => {
		await createComponent();

		await component.onSubmit(new Event('submit'));

		await harness.fixture.whenStable();
		harness.detectChanges();

		expect(projectServiceMock.createProject).not.toHaveBeenCalled();
	});
});
