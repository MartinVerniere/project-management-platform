import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, inject, input, output, signal } from '@angular/core';
import { ProjectService } from '../../services/projects/project-service';
import { AuthService } from '../../services/auth/auth-service';
import type { ProjectMemberDto } from '@shared/models/project';

@Component({
	selector: 'app-member-element',
	imports: [],
	templateUrl: './member-element.html',
	styleUrl: './member-element.css',
})
export class MemberElement {
	projectService = inject(ProjectService);
	authService = inject(AuthService);

	projectId = input.required<number>();
	member = input.required<ProjectMemberDto>();
	hasAdminPermissions = input.required<boolean>();

	memberRemoved = output<void>();

	error = signal<string | null>(null);
	
	hasDeletePermission = computed(() => {
		const userId = this.authService.user()?.id;

		if (!userId) return false;

		return this.member().user.id === userId && this.member().role === 'ADMIN';
	});

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
