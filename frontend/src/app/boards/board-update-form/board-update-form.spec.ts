import { TestBed } from '@angular/core/testing';
import { BoardUpdateForm } from './board-update-form';
import { of, throwError } from 'rxjs';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { BoardService } from '../../services/boards/board-service';
import { BoardDetailsDto } from '@shared/models/board';
import { Component } from '@angular/core';

@Component({
	standalone: true,
	template: '',
})
class DummyComponent { }

describe('BoardUpdateForm', () => {
	let component: BoardUpdateForm;
	let harness: RouterTestingHarness;
	let router: Router;

	const currentBoard: BoardDetailsDto = {
		id: 1,
		name: "Board A",
		projectId: 1,
		columns: []
	}

	const boardServiceMock = {
		getBoard: vi.fn(),
		updateBoard: vi.fn()
	};

	async function createComponent(shouldAwait: boolean = true) {
		component = await harness.navigateByUrl('/projects/1/boards/1/edit', BoardUpdateForm);

		if (shouldAwait) {
			await harness.fixture.whenStable();
			harness.detectChanges();
		}
	}

	function setDefaultReturnValues() {
		boardServiceMock.getBoard.mockReturnValue(of(currentBoard));
		boardServiceMock.updateBoard.mockReturnValue(of({}));
	}

	beforeEach(async () => {
		vi.clearAllMocks();

		setDefaultReturnValues();

		await TestBed.configureTestingModule({
			imports: [BoardUpdateForm],
			providers: [
				{ provide: BoardService, useValue: boardServiceMock },
				provideRouter([
					{ path: 'projects/:projectId/boards/:boardId/edit', component: BoardUpdateForm },
					{ path: 'projects/:id', component: DummyComponent },
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

	it('should load board', async () => {
		await createComponent();

		expect(boardServiceMock.getBoard).toHaveBeenCalledWith(1);
	});

	it('should load existing board into the form', async () => {
		await createComponent();

		expect(component.boardModel()).toEqual({ name: 'Board A' });
	});

	it('should update board when valid form data, then redirect to /projects/projectId and clear form', async () => {
		await createComponent();

		component.boardModel.set({ name: 'Updated A' });

		await component.onSubmit(new Event('submit'));

		await harness.fixture.whenStable();

		expect(boardServiceMock.updateBoard).toHaveBeenCalledWith(currentBoard.id, { name: 'Updated A' });
		expect(component.boardModel()).toEqual({ name: '' });
		expect(router.url).toBe('/projects/1');
	});

	it('should not update board when invalid form data', async () => {
		await createComponent();

		component.resetForm(); //Clear name loaded from fetch

		await component.onSubmit(new Event('submit'));

		expect(boardServiceMock.updateBoard).not.toHaveBeenCalled();
	});

	it('should set error when updating board fails', async () => {
		boardServiceMock.updateBoard.mockReturnValue(throwError(() => ({
			error: {
				error: {
					code: 'ERROR_MESSAGE',
					message: 'Error message'
				}
			}
		})));

		await createComponent();

		component.boardModel.set({ name: 'ERROR NAME' });

		await component.onSubmit(new Event('submit'));

		expect(component.error()).not.toBe('');
	});

	it('should navigate to projects/:id when "Cancel" button clicked', async () => {
		await createComponent();

		component.onCancel();

		await harness.fixture.whenStable();

		expect(router.url).toBe('/projects/1');
	});
});
