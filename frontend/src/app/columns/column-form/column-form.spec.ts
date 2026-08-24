import { TestBed } from '@angular/core/testing';
import { ColumnForm } from './column-form';
import { BoardService } from '../../services/boards/board-service';
import { provideRouter, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { RouterTestingHarness } from '@angular/router/testing';
import { Component } from '@angular/core';

@Component({ standalone: true, template: '' }) class DummyComponent { }

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
		};
	};

	function setDefaultReturnValues() {
		boardServiceMock.createColumn.mockReturnValue(of({}));
	};

	async function setHarnessAndRouter() {
		harness = await RouterTestingHarness.create();
		router = TestBed.inject(Router);
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

		await setHarnessAndRouter();
	});

	it('should create', async () => {
		await createComponent();

		expect(component).toBeTruthy();
	});

	it('should create column when valid form data, then redirect to /projects/projectId/boards/boardId and clear form', async () => {
		boardServiceMock.createColumn.mockReturnValue(of({}));

		await createComponent();

		component.columnModel.set({ name: 'Column A' });

		harness.detectChanges(); 
		await harness.fixture.whenStable();

		const createButton = Array
			.from(harness.routeNativeElement!.querySelectorAll('button'))
			.find(button => button.textContent?.includes('Create column'));

		expect(createButton).toBeTruthy();

		createButton!.click();

		await harness.fixture.whenStable();
		harness.detectChanges();

		expect(boardServiceMock.createColumn).toHaveBeenCalledWith(1, { name: 'Column A' });
		expect(component.columnModel()).toEqual({ name: '' });
		expect(router.url).toBe('/projects/1/boards/1');
	});

	it('should not create column when invalid form data', async () => {
		await createComponent();

		harness.detectChanges(); 
		await harness.fixture.whenStable();

		const createButton = Array
			.from(harness.routeNativeElement!.querySelectorAll('button'))
			.find(button => button.textContent?.includes('Create column'));

		expect(createButton).toBeTruthy();
		expect(createButton!.disabled).toBe(true); 

		createButton!.click();

		await harness.fixture.whenStable();
		harness.detectChanges();

		expect(boardServiceMock.createColumn).not.toHaveBeenCalled();
	});

	it('should set error when creating column fails', async () => {
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

		harness.detectChanges(); 
		await harness.fixture.whenStable();

		const createButton = Array
			.from(harness.routeNativeElement!.querySelectorAll('button'))
			.find(button => button.textContent?.includes('Create column'));

		expect(createButton).toBeTruthy();

		createButton!.click();

		expect(component.error()).not.toBe('');
	});
});
