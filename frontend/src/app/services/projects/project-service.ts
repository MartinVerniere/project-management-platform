import { HttpClient } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { Observable } from 'rxjs';
import { AddMemberResponse, CreateProjectRequest, CreateProjectResponse, ProjectDetailsResponse, ProjectMemberResponse, ProjectResponse, UpdateProjectRequest, UpdateProjectResponse } from '../../models/project';
import { BoardResponse, CreateBoardRequest, CreateBoardResponse } from '../../models/board';

const API_URL = 'http://localhost:3000/api/projects';

@Service()
export class ProjectService {
	private http = inject(HttpClient);

	getProjects(): Observable<ProjectResponse[]> {
		return this.http.get<ProjectResponse[]>(`${API_URL}`);
	}

	getProject(projectId: number): Observable<ProjectDetailsResponse> {
		return this.http.get<ProjectDetailsResponse>(`${API_URL}/${projectId}`);
	}

	createProject(request: CreateProjectRequest): Observable<CreateProjectResponse> {
		return this.http.post<CreateProjectResponse>(`${API_URL}`, request);
	}

	updateProject(projectId: number, request: UpdateProjectRequest): Observable<UpdateProjectResponse> {
		return this.http.put<UpdateProjectResponse>(`${API_URL}/${projectId}`, request);
	}

	deleteProject(projectId: number): Observable<void> {
		return this.http.delete<void>(`${API_URL}/${projectId}`,)
	}

	getMembers(projectId: number): Observable<ProjectMemberResponse[]> {
		return this.http.get<ProjectMemberResponse[]>(`${API_URL}/${projectId}/members`);
	}

	addMember(projectId: number, userId: number): Observable<AddMemberResponse> {
		return this.http.post<AddMemberResponse>(`${API_URL}/${projectId}/members`, { userId: userId });
	}

	removeMember(projectId: number, userId: number): Observable<void> {
		return this.http.delete<void>(`${API_URL}/${projectId}/members/${userId}`);
	}

	getBoards(projectId: number): Observable<BoardResponse[]> {
		return this.http.get<BoardResponse[]>(`${API_URL}/${projectId}/boards`);
	}

	createBoard(projectId: number, request: CreateBoardRequest): Observable<CreateBoardResponse> {
		return this.http.post<CreateBoardResponse>(`${API_URL}/${projectId}/boards`, request);
	}
}
