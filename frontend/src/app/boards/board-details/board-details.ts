import { Component, inject, resource } from "@angular/core";
import { RouterLink, ActivatedRoute } from "@angular/router";
import { firstValueFrom } from "rxjs";
import { ColumnList } from "../../columns/column-list/column-list";
import { BoardService } from "../../services/boards/board-service";

@Component({
	selector: 'app-board-details',
	imports: [ColumnList, RouterLink],
	templateUrl: './board-details.html',
	styleUrl: './board-details.css',
})
export class BoardDetails {
	route = inject(ActivatedRoute);
	boardService = inject(BoardService);

	projectId = Number(this.route.snapshot.paramMap.get("projectId")!);
	boardId = Number(this.route.snapshot.paramMap.get("boardId")!);

	board = resource({ loader: () => firstValueFrom(this.boardService.getBoard(this.boardId)) });

	async onDeleteColumn() {
		this.board.reload();
	}

	async onMovedColumn() {
		this.board.reload();
	}

	async onDeleteTask() {
		this.board.reload();
	}

	async onMovedTask() {
		this.board.reload();
	}
}
