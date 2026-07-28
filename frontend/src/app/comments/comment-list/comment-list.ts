import { Component, inject, input, output, signal } from '@angular/core';
import { Comment, TaskService } from '../../services/tasks/task-service';
import { RouterLink } from '@angular/router';

@Component({
	selector: 'app-comment-list',
	imports: [RouterLink],
	templateUrl: './comment-list.html',
	styleUrl: './comment-list.css',
})
export class CommentList {
	taskService = inject(TaskService);

	commentList = input.required<Comment[]>();
	projectId = input.required<number>();
	boardId = input.required<number>();
	columnId = input.required<number>();
	taskId = input.required<number>();

	commentDeleted = output<void>();

	error = signal<string | null>(null);
}
