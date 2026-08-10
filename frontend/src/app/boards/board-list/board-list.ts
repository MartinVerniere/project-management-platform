import { Component, inject, input, resource } from "@angular/core";
import { RouterLink } from "@angular/router";
import { firstValueFrom } from "rxjs";
import { ProjectService } from "../../services/projects/project-service";
import { BoardElement } from "../board-element/board-element";

@Component({
	selector: 'app-board-list',
	imports: [BoardElement, RouterLink],
	templateUrl: './board-list.html',
	styleUrl: './board-list.css',
})
export class BoardList {
	projectService = inject(ProjectService);

	projectId = input.required<number>();
	hasAdminPermissions = input.required<boolean>();

	boardList = resource({ loader: () => firstValueFrom(this.projectService.getBoards(this.projectId())) });

	onDeleteBoard() {
		this.boardList.reload();
	}
}
