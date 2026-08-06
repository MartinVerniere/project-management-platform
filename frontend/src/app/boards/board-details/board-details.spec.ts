import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BoardDetails } from './board-details';
import { ActivatedRoute } from '@angular/router';
import { BoardService } from '../../services/boards/board-service';
import { NEVER, of, throwError } from 'rxjs';
import { Component, input, output } from '@angular/core';
import { ColumnList } from '../../columns/column-list/column-list';
import { By } from '@angular/platform-browser';
import { ColumnResponse } from '../../models/column';

@Component({
	selector: 'app-column-list',
	standalone: true,
	template: '',
})
class ColumnListStub {
	columnList = input.required<ColumnResponse[]>();
	projectId = input.required<number>();
	boardId = input.required<number>();

	columnListEdited = output<void>();
}

describe('BoardDetails', () => {
	let component: BoardDetails;
	let fixture: ComponentFixture<BoardDetails>;
	let html: HTMLElement;

	const activatedRouteMock = {
		snapshot: {
			paramMap: {
				get: (key: string) => {
					if (key === 'projectId') return '1';
					if (key === 'boardId') return '1';
					return null;
				}
			}
		}
	};

	let boardServiceMock = { getBoard: vi.fn() };

	const board = {
		id: 1,
		name: 'Board A',
		columns: [{ id: 1, name: 'Todo' }],
	};

	async function createComponent(shouldAwait: boolean = true) {
		fixture = TestBed.createComponent(BoardDetails);
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
			imports: [BoardDetails],
			providers: [
				{ provide: BoardService, useValue: boardServiceMock },
				{ provide: ActivatedRoute, useValue: activatedRouteMock }
			]
		}).overrideComponent(BoardDetails, {
			remove: {
				imports: [ColumnList],
			},
			add: {
				imports: [ColumnListStub],
			}
		}).compileComponents();
	});

	it('should create', async () => {
		boardServiceMock.getBoard.mockReturnValue(of(board));

		await createComponent();

		expect(component).toBeTruthy();
	});

	it('should load board', async () => {
		boardServiceMock.getBoard.mockReturnValue(of(board));

		await createComponent();

		expect(boardServiceMock.getBoard).toHaveBeenCalledWith(1);
	});

	it('should show loading state', async () => {
		boardServiceMock.getBoard.mockReturnValue(NEVER);

		await createComponent(false);

		expect(html.textContent).toContain('Loading...');
	});


	it('should show error state', async () => {
		boardServiceMock.getBoard.mockReturnValue(throwError(() => new Error()));

		await createComponent();

		expect(html.textContent).toContain('Error loading board');
	});

	it('should render board information', async () => {
		boardServiceMock.getBoard.mockReturnValue(of(board));

		await createComponent();

		expect(html.textContent).toContain('Board A');
	});

	it('should reload board when ColumnList emits columnListEdited', async () => {
		boardServiceMock.getBoard.mockReturnValue(of(board));

		await createComponent();

		const child = fixture.debugElement
			.query(By.directive(ColumnListStub))
			.componentInstance as ColumnListStub;

		const emitSpy = vi.spyOn(component.board, 'reload');

		child.columnListEdited.emit();

		expect(emitSpy).toHaveBeenCalled();
	});
});
