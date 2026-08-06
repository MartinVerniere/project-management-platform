import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BoardElement } from './board-element';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';
import { BoardResponse } from '../../models/board';
import { BoardService } from '../../services/boards/board-service';

describe('BoardElement', () => {
	let fixture: ComponentFixture<BoardElement>;
	let component: BoardElement;
	let html: HTMLElement;

	const boardServiceMock = { deleteBoard: vi.fn() };

	const activatedRouteMock = {
		snapshot: {
			paramMap: {
				get: (key: string) => {
					if (key === 'projectId') return '1';
					return null;
				}
			}
		}
	};

	const board: BoardResponse = {
		id: 1,
		name: 'Board A',
		columns: [],
	};

	const projectId: number = 1;

	async function createComponent(shouldAwait: boolean = true) {
		fixture = TestBed.createComponent(BoardElement);
		component = fixture.componentInstance;
		html = fixture.nativeElement;

		fixture.componentRef.setInput('board', board);
		fixture.componentRef.setInput('projectId', projectId);

		fixture.detectChanges();

		if (shouldAwait) {
			await fixture.whenStable();
			fixture.detectChanges();
		}
	}

	beforeEach(async () => {
		vi.clearAllMocks();

		await TestBed.configureTestingModule({
			imports: [BoardElement],
			providers: [
				{ provide: BoardService, useValue: boardServiceMock },
				{ provide: ActivatedRoute, useValue: activatedRouteMock }
			]
		}).compileComponents();
	});

	it('should create', async () => {
		await createComponent();

		expect(component).toBeTruthy();
	});

	it('should render board information', async () => {
		await createComponent();

		expect(html.textContent).toContain('Board A');
	});

	it('should delete board and emit boardDeleted on clicking "Delete" button', async () => {
		boardServiceMock.deleteBoard.mockReturnValue(of({}));

		await createComponent();

		const emitSpy = vi.spyOn(component.boardDeleted, 'emit');

		const deleteButton = Array
			.from(html.querySelectorAll('button'))
			.find(button => button.textContent?.includes('Delete'));

		expect(deleteButton).toBeTruthy();

		deleteButton!.click();

		await fixture.whenStable();

		expect(boardServiceMock.deleteBoard).toHaveBeenCalledWith(1);
		expect(emitSpy).toHaveBeenCalled();
	});
});
