import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ColumnUpdateForm } from './column-update-form';
import { ActivatedRoute, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { ColumnService } from '../../services/columns/column-service';
import { ColumnDto } from '@shared/models/column';

describe('ColumnUpdateForm', () => {
	let fixture: ComponentFixture<ColumnUpdateForm>;
	let component: ColumnUpdateForm;
	let html: HTMLElement;

	const currentColumn: ColumnDto = {
		id: 1,
		name: "Column A",
		boardId: 1,
		order: 0
	}

	let columnServiceMock = {
		getColumn: vi.fn().mockReturnValue(of(currentColumn)),
		updateColumn: vi.fn().mockReturnValue(of({}))
	};

	let routerMock = { navigate: vi.fn().mockResolvedValue(true) };

	const activatedRouteMock = {
		snapshot: {
			paramMap: {
				get: (key: string) => {
					if (key === 'projectId') return '1';
					if (key === 'boardId') return '1';
					if (key === 'columnId') return '1';
					return null;
				}
			}
		}
	}

	async function createComponent(shouldAwait: boolean = true) {
		fixture = TestBed.createComponent(ColumnUpdateForm);
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
			imports: [ColumnUpdateForm],
			providers: [
				{ provide: ColumnService, useValue: columnServiceMock },
				{ provide: ActivatedRoute, useValue: activatedRouteMock },
				{ provide: Router, useValue: routerMock },
			]
		}).compileComponents();
	});

	it('should create', async () => {
		await createComponent();

		expect(component).toBeTruthy();
	});

	it('should load board', async () => {
		await createComponent();

		expect(columnServiceMock.getColumn).toHaveBeenCalledWith(1);
	});

	it('should load existing board into the form', async () => {
		await createComponent();

		expect(component.columnModel()).toEqual({ name: 'Column A' });
	});

	it('should update board when valid form data, then redirect to /projects/projectId/boards/boardId and clear form', async () => {
		await createComponent();

		component.columnModel.set({ name: 'Updated A' });

		await component.onSubmit(new Event('submit'));

		expect(columnServiceMock.updateColumn).toHaveBeenCalledWith(currentColumn.id, { name: 'Updated A' });
		expect(routerMock.navigate).toHaveBeenCalledWith(['/projects', 1, 'boards', 1]);
		expect(component.columnModel()).toEqual({ name: '' });
	});

	it('should not update board when invalid form data', async () => {
		await createComponent();

		component.resetForm(); //Clear information loaded from fetch

		await component.onSubmit(new Event('submit'));

		await fixture.whenStable();

		expect(columnServiceMock.updateColumn).not.toHaveBeenCalled();
	});

	it('should set error when updating board fails', async () => {
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

		expect(component.error()).not.toBe('');
	});
});
