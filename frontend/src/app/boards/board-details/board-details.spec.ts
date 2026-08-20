import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BoardDetails } from './board-details';
import { ActivatedRoute } from '@angular/router';
import { BoardService } from '../../services/boards/board-service';
import { NEVER, of, throwError } from 'rxjs';
import { Component, input, output } from '@angular/core';
import { ColumnList } from '../../columns/column-list/column-list';
import { By } from '@angular/platform-browser';
import { AuthService } from '../../services/auth/auth-service';
import { ProjectService } from '../../services/projects/project-service';
import { ColumnDetailsDto } from '@shared/models/column';
import { ProjectMemberDto } from '@shared/models/project';
import { UserDto } from '@shared/models/user';

@Component({
	selector: 'app-column-list',
	standalone: true,
	template: '',
})
class ColumnListStub {
	columnList = input.required<ColumnDetailsDto[]>();
	projectId = input.required<number>();
	boardId = input.required<number>();
	members = input.required<ProjectMemberDto[]>();
	hasAdminPermissions = input.required<boolean>();

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
	let projectServiceMock = { getMembers: vi.fn() };
	let authServiceMock = { user: vi.fn() };

	const board = {
		id: 1,
		name: 'Board A',
		columns: [{ id: 1, name: 'Todo' }],
	};

	const me: UserDto = {
		id: 1,
		username: 'john',
		email: 'john@test.com',
		avatarUrl: '/images/default-avatar.png'
	}

	const members: ProjectMemberDto[] = [
		{
			id: 1,
			role: 'ADMIN',
			user: me
		},
		{
			id: 2,
			role: 'MEMBER',
			user: {
				id: 2,
				username: 'alice',
				email: 'alice@test.com',
				avatarUrl: '/images/default-avatar.png'
			}
		},
		{
			id: 3,
			role: 'MEMBER',
			user: {
				id: 3,
				username: 'martin',
				email: 'martin@test.com',
				avatarUrl: '/images/default-avatar.png'
			}
		}
	]

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
				{ provide: ProjectService, useValue: projectServiceMock },
				{ provide: AuthService, useValue: authServiceMock },
				{ provide: ActivatedRoute, useValue: activatedRouteMock }
			]
		}).overrideComponent(BoardDetails, {
			remove: { imports: [ColumnList] },
			add: { imports: [ColumnListStub] }
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

	it('should fetch project members', async () => {
		projectServiceMock.getMembers.mockReturnValue(of(members));

		await createComponent();

		expect(projectServiceMock.getMembers).toHaveBeenCalledWith(1);
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
		projectServiceMock.getMembers.mockReturnValue(of({ members }));
		boardServiceMock.getBoard.mockReturnValue(of(board));

		await createComponent();

		expect(html.textContent).toContain('Board A');
	});

	it('should not render "Add column" button when user doesnt have admin permissions', () => {
		authServiceMock.user.mockReturnValue(of({ me }));
		projectServiceMock.getMembers.mockReturnValue(of({ members }));
		boardServiceMock.getBoard.mockReturnValue(of(board));

		const addColumnButton = Array
			.from(html.querySelectorAll('button'))
			.find(button => button.textContent?.includes('Add column'));

		expect(addColumnButton).toBeUndefined();
	});

	it('should reload board when ColumnList emits columnListEdited', async () => {
		authServiceMock.user.mockReturnValue(of({ me }));
		projectServiceMock.getMembers.mockReturnValue(of({ members }));
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
