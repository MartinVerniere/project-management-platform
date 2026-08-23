import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { ProjectService } from './project-service';
import type { ProjectDetailsDto, ProjectMemberDto } from '@shared/models/project';
import { BoardDto } from '@shared/models/board';
import { UserDto } from '@shared/models/user';
import { CreateProjectRequest } from '../../models/project';
import { CreateBoardRequest } from '../../models/board';

describe('ProjectService', () => {
	let service: ProjectService;
	let httpMock: HttpTestingController;

	const memberA: ProjectMemberDto = {
		id: 1,
		role: 'ADMIN',
		user: { id: 1, username: 'john', email: 'john@email.com', avatarUrl: '/images/default-avatar.png' }
	};

	const memberB: ProjectMemberDto = {
		id: 2,
		role: 'MEMBER',
		user: { id: 2, username: 'alice', email: 'alice@email.com', avatarUrl: '/images/default-avatar.png' }
	};

	const memberC: ProjectMemberDto = {
		id: 3,
		role: 'ADMIN',
		user: { id: 3, username: 'martin', email: 'martin@email.com', avatarUrl: '/images/default-avatar.png' }
	};

	const projectA: ProjectDetailsDto = {
		id: 1,
		name: 'Project A',
		key: 'PRA',
		description: 'Project A',
		members: [memberA, memberB],
		boards: []
	};

	const projectB: ProjectDetailsDto = {
		id: 2,
		name: 'Project B',
		key: 'PRB',
		description: 'Project B',
		members: [memberC],
		boards: []
	};

	function setupService() {
		httpMock = TestBed.inject(HttpTestingController);
		service = TestBed.inject(ProjectService);
	};

	beforeEach(() => {
		vi.clearAllMocks();
		localStorage.clear();

		TestBed.configureTestingModule({
			providers: [
				provideHttpClient(),
				provideHttpClientTesting(),
			]
		});
	});

	it('should be created', () => {
		setupService();

		expect(service).toBeTruthy();
	});

	it('should get projects', () => {
		const expectedResponse = [projectA, projectB];

		setupService();

		service.getProjects().subscribe(projects => {
			expect(projects).toEqual(expectedResponse);
		});

		const request = httpMock.expectOne(`http://localhost:3000/api/projects`);
		expect(request.request.method).toBe('GET');
		request.flush(expectedResponse);
	});

	it('should get project by id', () => {
		const expectedResponse = projectA;

		setupService();

		service.getProject(1).subscribe(project => {
			expect(project).toEqual(expectedResponse);
		});

		const request = httpMock.expectOne(`http://localhost:3000/api/projects/1`);
		expect(request.request.method).toBe('GET');
		request.flush(expectedResponse);
	});

	it('should create project', () => {
		const project: CreateProjectRequest = { name: 'Project A', key: 'PRA', description: 'Project A' };
		const expectedResponse = { ...project, id: 1 };

		setupService();

		service.createProject(project).subscribe(created => {
			expect(created).toEqual(expectedResponse);
		});

		const request = httpMock.expectOne(`http://localhost:3000/api/projects`);
		expect(request.request.method).toBe('POST');
		expect(request.request.body).toEqual(project);
		request.flush(expectedResponse);
	});

	it('should delete project', () => {
		setupService();

		service.deleteProject(1).subscribe(response => {
			expect(response).toEqual({});
		});

		const request = httpMock.expectOne(`http://localhost:3000/api/projects/1`);
		expect(request.request.method).toBe('DELETE');
		request.flush({});
	});

	it('should get project members', () => {
		const expectedResponse = [memberA, memberB];

		setupService();

		service.getMembers(projectA.id).subscribe(members => {
			expect(members).toEqual(expectedResponse);
		});

		const request = httpMock.expectOne(`http://localhost:3000/api/projects/${projectA.id}/members`);
		expect(request.request.method).toBe('GET');
		request.flush(expectedResponse);
	});

	it('should add member to project', () => {
		const user: UserDto = { id: 3, username: 'martin', email: 'martin@email.com', avatarUrl: null };

		setupService();

		service.addMember(projectA.id, user.id).subscribe();

		const request = httpMock.expectOne(`http://localhost:3000/api/projects/${projectA.id}/members`);
		expect(request.request.body).toEqual({ userId: user.id });
		expect(request.request.method).toBe('POST');
		request.flush({});
	});

	it('should remove member from project', () => {
		const user: UserDto = { id: 1, username: 'john', email: 'john@email.com', avatarUrl: null };

		setupService();

		service.removeMember(projectA.id, user.id).subscribe();

		const request = httpMock.expectOne(`http://localhost:3000/api/projects/${projectA.id}/members/${user.id}`);
		expect(request.request.method).toBe('DELETE');
		request.flush({});
	});

	it('should get boards from project', () => {
		const expectedBoards: BoardDto[] = [{ id: 1, name: 'Board 1', projectId: 1 }];

		setupService();

		service.getBoards(projectA.id).subscribe(boards => {
			expect(boards).toEqual(expectedBoards);
		});

		const request = httpMock.expectOne(`http://localhost:3000/api/projects/${projectA.id}/boards`);
		expect(request.request.method).toBe('GET');
		request.flush(expectedBoards);
	});

	it('should create board', () => {
		const board: CreateBoardRequest = { name: "Board A" };
		const expectedResponse = { ...board, id: 1 };

		setupService();

		service.createBoard(projectA.id, board).subscribe(created => {
			expect(created).toEqual(expectedResponse);
		});

		const request = httpMock.expectOne(`http://localhost:3000/api/projects/${projectA.id}/boards`);
		expect(request.request.method).toBe('POST');
		expect(request.request.body).toEqual(board);
		request.flush(expectedResponse);
	});
});
