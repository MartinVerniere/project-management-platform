import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BoardList } from './board-list';
import { NEVER, of, throwError } from 'rxjs';
import { ActivatedRoute } from '@angular/router';
import { ProjectService } from '../../services/projects/project-service';
import { Component, input, output } from '@angular/core';
import { BoardElement } from '../board-element/board-element';
import { By } from '@angular/platform-browser';
import { BoardResponse } from '../../models/board';

@Component({
	selector: 'app-board-element',
	standalone: true,
	template: '',
})
class BoardElementStub {
	board = input.required<BoardResponse>();
	projectId = input.required<number>();
	hasAdminPermissions = input.required<boolean>();

	boardDeleted = output<void>();
}

describe('BoardList', () => {
	let fixture: ComponentFixture<BoardList>;
	let component: BoardList;
	let html: HTMLElement;

	const projectServiceMock = { getBoards: vi.fn() };

	const activatedRouteMock = {
		snapshot: {
			paramMap: {
				get: (key: string) => {
					if (key === 'id') return '1';
					return null;
				}
			}
		}
	}

	const projectId = 1;

	const boards: BoardResponse[] = [
		{
			id: 1,
			name: 'Board A',
			columns: []
		},
		{
			id: 2,
			name: 'Board B',
			columns: []
		}
	];

	async function createComponent(shouldAwait = true, hasAdminPermissions = true) {
		fixture = TestBed.createComponent(BoardList);
		component = fixture.componentInstance;
		html = fixture.nativeElement;

		fixture.componentRef.setInput('projectId', projectId);
		fixture.componentRef.setInput('hasAdminPermissions', hasAdminPermissions);

		fixture.detectChanges();

		if (shouldAwait) {
			await fixture.whenStable();
			fixture.detectChanges();
		}
	}

	beforeEach(async () => {
		vi.clearAllMocks();

		await TestBed.configureTestingModule({
			imports: [BoardList],
			providers: [
				{ provide: ProjectService, useValue: projectServiceMock },
				{ provide: ActivatedRoute, useValue: activatedRouteMock },
			]
		}).overrideComponent(BoardList, {
			remove: { imports: [BoardElement] },
			add: { imports: [BoardElementStub] }
		}).compileComponents();
	});

	it('should create', async () => {
		await createComponent();

		expect(component).toBeTruthy();
	});

	it('should show loading state', async () => {
		projectServiceMock.getBoards.mockReturnValue(NEVER);

		await createComponent(false);

		expect(html.textContent).toContain('Loading...');
	});

	it('should render boards', async () => {
		projectServiceMock.getBoards.mockReturnValue(of(boards));

		await createComponent();

		const children = fixture.debugElement.queryAll(By.directive(BoardElementStub));

		expect(children).toHaveLength(2);
	});

	it('should show empty state', async () => {
		projectServiceMock.getBoards.mockReturnValue(of([]));

		await createComponent();

		expect(html.textContent).toContain('No boards yet.');
	});

	it('should show error state', async () => {
		projectServiceMock.getBoards.mockReturnValue(throwError(() => new Error()));

		await createComponent();

		expect(html.textContent).toContain('Error loading boards');
	});

	it('should not render "Add board" button when user doesnt have admin permissions', async () => {
		await createComponent(true, false);

		const addBoardButton = Array
			.from(html.querySelectorAll('button'))
			.find(button => button.textContent?.includes('Edit'));

		expect(addBoardButton).toBeUndefined();
	});

	it('should reload board list when BoardElement emits boardDeleted', async () => {
		projectServiceMock.getBoards.mockReturnValue(of(boards));

		await createComponent();

		const child = fixture.debugElement
			.query(By.directive(BoardElementStub))
			.componentInstance as BoardElementStub;

		const reloadSpy = vi.spyOn(component.boardList, 'reload');

		child.boardDeleted.emit();

		expect(reloadSpy).toHaveBeenCalled();
	});
});
