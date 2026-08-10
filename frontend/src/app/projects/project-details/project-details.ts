import { Component, computed, inject, resource } from "@angular/core";
import { RouterLink, ActivatedRoute } from "@angular/router";
import { firstValueFrom } from "rxjs";
import { BoardList } from "../../boards/board-list/board-list";
import { MemberList } from "../../members/member-list/member-list";
import { ProjectService } from "../../services/projects/project-service";
import { AuthService } from "../../services/auth/auth-service";

@Component({
	selector: 'app-project-details',
	imports: [RouterLink, MemberList, BoardList],
	templateUrl: './project-details.html',
	styleUrl: './project-details.css',
})

export class ProjectDetails {
	route = inject(ActivatedRoute);
	projectService = inject(ProjectService);
	authService = inject(AuthService);

	projectId = Number(this.route.snapshot.paramMap.get("id")!);

	project = resource({ loader: () => firstValueFrom(this.projectService.getProject(this.projectId)) });

	hasAdminPermissions = computed(() => {
		const userId = this.authService.user()?.id;
		const project = this.project.value();

		if (!userId || !project) return false;

		const members = project.members;
		return members.some(member => member.user.id === userId && member.role === 'ADMIN');
	});

	async onMemberAdded() {
		this.project.reload();
	}

	async onMemberRemoved() {
		this.project.reload();
	}
}
