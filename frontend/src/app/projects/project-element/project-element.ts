import { Component, computed, inject, input, output, resource, signal } from '@angular/core';
import { ProjectService } from '../../services/projects/project-service';
import { RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthService } from '../../services/auth/auth-service';
import { firstValueFrom } from 'rxjs';
import { ProjectDto } from '@shared/models/project';

@Component({
	selector: 'app-project-element',
	imports: [RouterLink],
	templateUrl: './project-element.html',
	styleUrl: './project-element.css',
})
export class ProjectElement {
	projectService = inject(ProjectService);
	authService = inject(AuthService);

	project = input.required<ProjectDto>();
	projectDeleted = output<void>();

	members = resource({ loader: () => firstValueFrom(this.projectService.getMembers(this.project().id)) });

	hasDeletePermission = computed(() => {
		const userId = this.authService.user()?.id;
		const members = this.members.value();

		if (!userId || !members) return false;

		return members.some(member => member.user.id === userId && member.role === 'ADMIN');
	});

	error = signal<string | null>(null);

	onDeleteProject(projectId: number) {
		this.projectService.deleteProject(projectId).subscribe({
			next: () => {
				this.projectDeleted.emit();
				this.error.set(null);
			},
			error: (response: HttpErrorResponse) => {
				const errorObject = response.error.error;
				console.log(errorObject);
				this.error.set(errorObject.message);
			}
		});
	}
}
