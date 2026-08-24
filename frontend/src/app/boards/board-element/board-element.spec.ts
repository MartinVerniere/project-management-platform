import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BoardElement } from './board-element';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { BoardService } from '../../services/boards/board-service';
import type { BoardDto } from '@shared/models/board';

describe('BoardElement', () => {
	let fixture: ComponentFixture<BoardElement>;
	let component: BoardElement;
	let html: HTMLElement;

	const boardServiceMock = { deleteBoard: vi.fn() };

	const projectId: number = 1;

	const board: BoardDto = { id: 1, name: 'Board A', projectId };

	async function createComponent(shouldAwait = true, hasAdminPermissions = true) {
		fixture = TestBed.createComponent(BoardElement);
		component = fixture.componentInstance;
		html = fixture.nativeElement;

		fixture.componentRef.setInput('board', board);
		fixture.componentRef.setInput('projectId', projectId);
		fixture.componentRef.setInput('hasAdminPermissions', hasAdminPermissions);

		fixture.detectChanges();

		if (shouldAwait) {
			await fixture.whenStable();
			fixture.detectChanges();
		};
	};

	function setDefaultReturnValues() {
		boardServiceMock.deleteBoard.mockReturnValue(of({}));
	};

	beforeEach(async () => {
		vi.clearAllMocks();

		setDefaultReturnValues();

		await TestBed.configureTestingModule({
			imports: [BoardElement],
			providers: [
				{ provide: BoardService, useValue: boardServiceMock },
				provideRouter([]),
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


	it('should not render "Edit" and "Delete" buttons when user doesnt have admin permissions', async () => {
		await createComponent(true, false);

		const editButton = Array
			.from(html.querySelectorAll('button'))
			.find(button => button.textContent?.includes('Edit'));

		const deleteButton = Array
			.from(html.querySelectorAll('button'))
			.find(button => button.textContent?.includes('Delete'));

		expect(editButton).toBeUndefined();
		expect(deleteButton).toBeUndefined();
	});

	it('should delete board and emit boardDeleted on clicking "Delete" button', async () => {
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
