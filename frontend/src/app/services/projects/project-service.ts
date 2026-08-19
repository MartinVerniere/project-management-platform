import { HttpClient } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { Observable } from 'rxjs';
import { CreateProjectRequest, UpdateProjectRequest } from '../../models/project';
import { CreateBoardRequest } from '../../models/board';
import { ProjectDetailsDto, ProjectDto, ProjectMemberDto } from '../../../../../shared/models/project';
import { BoardDetailsDto, BoardDto } from '../../../../../shared/models/board';

const API_URL = 'http://localhost:3000/api/projects';

@Service()
export class ProjectService {
	private http = inject(HttpClient);

	getProjects(): Observable<ProjectDto[]> {
		return this.http.get<ProjectDto[]>(`${API_URL}`);
	}

	getProject(projectId: number): Observable<ProjectDetailsDto> {
		return this.http.get<ProjectDetailsDto>(`${API_URL}/${projectId}`);
	}

	createProject(request: CreateProjectRequest): Observable<ProjectDto> {
		return this.http.post<ProjectDto>(`${API_URL}`, request);
	}

	updateProject(projectId: number, request: UpdateProjectRequest): Observable<ProjectDto> {
		return this.http.put<ProjectDto>(`${API_URL}/${projectId}`, request);
	}

	deleteProject(projectId: number): Observable<void> {
		return this.http.delete<void>(`${API_URL}/${projectId}`,)
	}

	getMembers(projectId: number): Observable<ProjectMemberDto[]> {
		return this.http.get<ProjectMemberDto[]>(`${API_URL}/${projectId}/members`);
	}

	addMember(projectId: number, userId: number): Observable<ProjectMemberDto> {
		return this.http.post<ProjectMemberDto>(`${API_URL}/${projectId}/members`, { userId: userId });
	}

	removeMember(projectId: number, userId: number): Observable<void> {
		return this.http.delete<void>(`${API_URL}/${projectId}/members/${userId}`);
	}

	getBoards(projectId: number): Observable<BoardDto[]> {
		return this.http.get<BoardDto[]>(`${API_URL}/${projectId}/boards`);
	}

	createBoard(projectId: number, request: CreateBoardRequest): Observable<BoardDto> {
		return this.http.post<BoardDto>(`${API_URL}/${projectId}/boards`, request);
	}
}
