import { TestBed } from '@angular/core/testing';
import { ColumnUpdateForm } from './column-update-form';
import { provideRouter, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { ColumnService } from '../../services/columns/column-service';
import type { ColumnDto } from '@shared/models/column';
import { RouterTestingHarness } from '@angular/router/testing';
import { Component } from '@angular/core';

@Component({
	standalone: true,
	template: '',
})
class DummyComponent { }

describe('ColumnUpdateForm', () => {
	let component: ColumnUpdateForm;
	let harness: RouterTestingHarness;
	let router: Router;

	const currentColumn: ColumnDto = {
		id: 1,
		name: "Column A",
		boardId: 1,
		order: 0
	}

	let columnServiceMock = {
		getColumn: vi.fn(),
		updateColumn: vi.fn()
	};

	async function createComponent(shouldAwait: boolean = true) {
		component = await harness.navigateByUrl('/projects/1/boards/1/columns/1/edit', ColumnUpdateForm);

		if (shouldAwait) {
			await harness.fixture.whenStable();
			harness.detectChanges();
		}
	};

	function setDefaultReturnValues() {
		columnServiceMock.getColumn.mockReturnValue(of(currentColumn));
		columnServiceMock.updateColumn.mockReturnValue(of({}));
	};

	beforeEach(async () => {
		vi.clearAllMocks();

		setDefaultReturnValues();

		await TestBed.configureTestingModule({
			imports: [ColumnUpdateForm],
			providers: [
				{ provide: ColumnService, useValue: columnServiceMock },
				provideRouter([
					{ path: 'projects/:projectId/boards/:boardId/columns/:columnId/edit', component: ColumnUpdateForm },
					{ path: 'projects/:projectId/boards/:boardId', component: DummyComponent },
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

	it('should load column', async () => {
		await createComponent();

		expect(columnServiceMock.getColumn).toHaveBeenCalledWith(1);
	});

	it('should load existing column into the form', async () => {
		await createComponent();

		expect(component.columnModel()).toEqual({ name: 'Column A' });
	});

	it('should update column when valid form data, then redirect to /projects/projectId/boards/boardId and clear form', async () => {
		await createComponent();

		component.columnModel.set({ name: 'Updated A' });

		await component.onSubmit(new Event('submit'));

		await harness.fixture.whenStable();

		expect(columnServiceMock.updateColumn).toHaveBeenCalledWith(currentColumn.id, { name: 'Updated A' });
		expect(component.columnModel()).toEqual({ name: '' });
		expect(router.url).toBe('/projects/1/boards/1');
	});

	it('should not update column when invalid form data', async () => {
		await createComponent();

		component.resetForm(); //Clear information loaded from fetch
		await component.onSubmit(new Event('submit'));

		await harness.fixture.whenStable();

		expect(columnServiceMock.updateColumn).not.toHaveBeenCalled();
	});

	it('should set error when updating column fails', async () => {
		columnServiceMock.updateColumn.mockReturnValue(throwError(() => ({
			error: {
				error: {
					code: 'ERROR_MESSAGE',
					message: 'Error message'
				}
			}
		})));

		await createComponent();

		component.columnModel.set({ name: 'ERROR NAME' });
		await component.onSubmit(new Event('submit'));

		await harness.fixture.whenStable();

		expect(component.error()).not.toBe('');
	});
});
