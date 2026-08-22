import { TestBed } from '@angular/core/testing';
import { ColumnForm } from './column-form';
import { BoardService } from '../../services/boards/board-service';
import { provideRouter, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { RouterTestingHarness } from '@angular/router/testing';
import { Component } from '@angular/core';

@Component({
	standalone: true,
	template: '',
})
class DummyComponent { }

describe('ColumnForm', () => {
	let component: ColumnForm;
	let harness: RouterTestingHarness;
	let router: Router;

	let boardServiceMock = { createColumn: vi.fn() };

	async function createComponent(shouldAwait: boolean = true) {
		component = await harness.navigateByUrl('/projects/1/boards/1/columns/create', ColumnForm);

		if (shouldAwait) {
			await harness.fixture.whenStable();
			harness.detectChanges();
		}
	};

	function setDefaultReturnValues() {
		boardServiceMock.createColumn.mockReturnValue(of({}));
	};

	beforeEach(async () => {
		vi.clearAllMocks();

		setDefaultReturnValues();

		await TestBed.configureTestingModule({
			imports: [ColumnForm],
			providers: [
				{ provide: BoardService, useValue: boardServiceMock },
				provideRouter([
					{ path: 'projects/:projectId/boards/:boardId/columns/create', component: ColumnForm, },
					{ path: 'projects/:projectId/boards/:boardId', component: DummyComponent, },
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

	it('should create column when valid form data, then redirect to /projects/projectId/boards/boardId and clear form', async () => {
		boardServiceMock.createColumn.mockReturnValue(of({}));

		await createComponent();

		component.columnModel.set({ name: 'Column A' });
		await component.onSubmit(new Event('submit'));

		await harness.fixture.whenStable();

		expect(boardServiceMock.createColumn).toHaveBeenCalledWith(1, { name: 'Column A' });
		expect(component.columnModel()).toEqual({ name: '' });
		expect(router.url).toBe('/projects/1/boards/1');
	});

	it('should not create column when invalid form data', async () => {
		await createComponent();

		await component.onSubmit(new Event('submit'));

		await harness.fixture.whenStable();

		expect(boardServiceMock.createColumn).not.toHaveBeenCalled();
	});

	it('should set error when creating board fails', async () => {
		boardServiceMock.createColumn.mockReturnValue(throwError(() => ({
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

		expect(component.error()).not.toBe('');
	});
});
