import { Component, inject, input, output, signal } from '@angular/core';
import { ProjectService } from '../../services/projects/project-service';
import { RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { ProjectResponse } from '../../models/project';

@Component({
	selector: 'app-project-element',
	imports: [RouterLink],
	templateUrl: './project-element.html',
	styleUrl: './project-element.css',
})
export class ProjectElement {
	projectService = inject(ProjectService);

	project = input.required<ProjectResponse>();
	projectDeleted = output<void>();

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
