import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, input, output, signal } from '@angular/core';
import { ProjectService } from '../../services/projects/project-service';
import type { ProjectMemberDto } from '@shared/models/project';
import { ToastService } from '../../services/toast/toast-service';

@Component({
	selector: 'app-member-element',
	imports: [],
	templateUrl: './member-element.html',
	styleUrl: './member-element.css',
})
export class MemberElement {
	projectService = inject(ProjectService);
	toastService = inject(ToastService);

	projectId = input.required<number>();
	member = input.required<ProjectMemberDto>();
	hasAdminPermissions = input.required<boolean>();

	memberRemoved = output<void>();

	error = signal<string | null>(null);

	onRemoveMember(userId: number) {
		this.projectService.removeMember(this.projectId(), userId).subscribe({
			next: () => {
				this.error.set(null);
				this.memberRemoved.emit();
				this.toastService.success('Member removed successfully.');
			},
			error: (response: HttpErrorResponse) => {
				const errorObject = response.error.error;
				console.log(errorObject);
				this.error.set(errorObject.message);
				this.toastService.error('Failed to remove member.');
			}
		});
	}
}
