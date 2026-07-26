import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, input, output, signal } from '@angular/core';
import { ProjectMember, ProjectService } from '../../services/projects/project-service';

@Component({
	selector: 'app-member-element',
	imports: [],
	templateUrl: './member-element.html',
	styleUrl: './member-element.css',
})
export class MemberElement {
	projectService = inject(ProjectService);

	projectId = input.required<number>();
	member = input.required<ProjectMember>();

	memberRemoved = output<void>();

	error = signal<string | null>(null);

	onRemoveMember(userId: number) {
		this.projectService.removeMember(this.projectId(), userId).subscribe({
			next: () => {
				this.error.set(null);
				this.memberRemoved.emit();
			},
			error: (response: HttpErrorResponse) => {
				const errorObject = response.error.error;
				console.log(errorObject);
				this.error.set(errorObject.message);
			}
		});
	}
}
