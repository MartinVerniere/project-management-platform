import { TestBed } from '@angular/core/testing';

import { BoardDetails } from './board-details';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { BoardService } from '../../services/boards/board-service';
import { NEVER, of, throwError } from 'rxjs';
import { Component, input, output } from '@angular/core';
import { ColumnList } from '../../columns/column-list/column-list';
import { By } from '@angular/platform-browser';
import { AuthService } from '../../services/auth/auth-service';
import { ProjectService } from '../../services/projects/project-service';
import type { ColumnDetailsDto } from '@shared/models/column';
import type { ProjectMemberDto } from '@shared/models/project';
import type { UserDto } from '@shared/models/user';

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
	let harness: RouterTestingHarness;
	let html: HTMLElement;

	const boardServiceMock = { getBoard: vi.fn() };
	const projectServiceMock = { getMembers: vi.fn() };
	const authServiceMock = { user: vi.fn() };

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
	};

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
	];

	async function createComponent(shouldAwait = true) {
		component = await harness.navigateByUrl('/projects/1/boards/1', BoardDetails);
		html = harness.routeNativeElement!;

		if (shouldAwait) {
			await harness.fixture.whenStable();
			harness.detectChanges();
		}
	};

	function setDefaultReturnValues() {
		boardServiceMock.getBoard.mockReturnValue(of(board));
		projectServiceMock.getMembers.mockReturnValue(of(members));
		authServiceMock.user.mockReturnValue(me);
	};

	beforeEach(async () => {
		vi.clearAllMocks();

		setDefaultReturnValues();

		await TestBed.configureTestingModule({
			imports: [BoardDetails],
			providers: [
				{ provide: BoardService, useValue: boardServiceMock },
				{ provide: ProjectService, useValue: projectServiceMock },
				{ provide: AuthService, useValue: authServiceMock },
				provideRouter([
					{
						path: 'projects/:projectId/boards/:boardId',
						component: BoardDetails,
					},
				]),
			]
		}).overrideComponent(BoardDetails, {
			remove: { imports: [ColumnList] },
			add: { imports: [ColumnListStub] }
		}).compileComponents();

		harness = await RouterTestingHarness.create();
	});

	it('should create', async () => {
		await createComponent();

		expect(component).toBeTruthy();
	});

	it('should load board', async () => {
		await createComponent();

		expect(boardServiceMock.getBoard).toHaveBeenCalledWith(1);
	});

	it('should fetch project members', async () => {
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
		await createComponent();

		expect(html.textContent).toContain('Board A');
	});

	it('should not render "Add column" button when user doesnt have admin permissions', async () => {
		authServiceMock.user.mockReturnValue({
			id: 2,
			username: 'alice',
			email: 'alice@test.com',
			avatarUrl: '/images/default-avatar.png'
		});
		await createComponent();

		const addColumnButton = Array
			.from(html.querySelectorAll('button'))
			.find(button => button.textContent?.includes('Add column'));

		expect(addColumnButton).toBeUndefined();
	});

	it('should reload board when ColumnList emits columnListEdited', async () => {
		await createComponent();

		const child = harness.routeDebugElement!
			.query(By.directive(ColumnListStub))
			.componentInstance as ColumnListStub;

		child.columnListEdited.emit();

		await harness.fixture.whenStable();

		expect(boardServiceMock.getBoard).toHaveBeenCalledTimes(2);
	});
});
