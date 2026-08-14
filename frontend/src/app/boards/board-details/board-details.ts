import { Component, computed, inject, resource } from "@angular/core";
import { RouterLink, ActivatedRoute } from "@angular/router";
import { firstValueFrom } from "rxjs";
import { ColumnList } from "../../columns/column-list/column-list";
import { BoardService } from "../../services/boards/board-service";
import { AuthService } from "../../services/auth/auth-service";
import { ProjectService } from "../../services/projects/project-service";

@Component({
	selector: 'app-board-details',
	imports: [ColumnList, RouterLink],
	templateUrl: './board-details.html',
	styleUrl: './board-details.css',
})
export class BoardDetails {
	route = inject(ActivatedRoute);
	projectService = inject(ProjectService);
	boardService = inject(BoardService);
	authService = inject(AuthService);

	projectId = Number(this.route.snapshot.paramMap.get("projectId")!);
	boardId = Number(this.route.snapshot.paramMap.get("boardId")!);

	board = resource({ loader: () => firstValueFrom(this.boardService.getBoard(this.boardId)) });
	members = resource({ loader: () => firstValueFrom(this.projectService.getMembers(this.projectId)) });

	hasAdminPermissions = computed(() => {
		const userId = this.authService.user()?.id;
		const members = this.members.value();

		if (!userId || !members) return false;

		return members.some(member => member.user.id === userId && member.role === 'ADMIN');
	});

	async onColumnListEdited() {
		this.board.reload();
	}
}
