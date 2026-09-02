import { HttpErrorResponse } from "@angular/common/http";
import { Component, inject, input, output, resource, computed, signal } from "@angular/core";
import { FormField, form, required, submit } from "@angular/forms/signals";
import { firstValueFrom } from "rxjs";
import { ProjectService } from "../../services/projects/project-service";
import { UserService } from "../../services/users/user-service";
import type { ProjectMemberDto } from "@shared/models/project";
import { ToastService } from "../../services/toast/toast-service";

export interface MemberModel {
	userId: string;
}

@Component({
	selector: 'app-member-form',
	imports: [FormField],
	templateUrl: './member-form.html',
	styleUrl: './member-form.css',
})

export class MemberForm {
	projectService = inject(ProjectService);
	userService = inject(UserService);
	toastService = inject(ToastService);

	projectId = input.required<number>();
	memberList = input.required<ProjectMemberDto[]>();

	memberAdded = output<void>();
	canceledMemberAdd = output<void>();

	users = resource({ loader: () => firstValueFrom(this.userService.getUsers()) });

	possibleUsers = computed(() => {
		const users = this.users.value();
		return users
			? users.filter(user => !(this.memberList().map(member => member.user.id).includes(user.id)))
			: [];
	});

	memberModel = signal<MemberModel>({
		userId: ''
	});
	error = signal<string | null>(null);

	memberForm = form(this.memberModel, (fieldPath) => {
		required(fieldPath.userId, { message: 'User is required' });
	});

	async onSubmit(event: Event) {
		event.preventDefault();

		submit(this.memberForm, async () => {
			if (this.memberModel().userId === '') return;

			const userId = Number(this.memberModel().userId);
			this.projectService.addMember(this.projectId(), userId).subscribe({
				next: () => {
					this.resetForm();
					this.error.set(null);
					this.toastService.success('Added member successfully.');
					this.memberAdded.emit();
				},
				error: (response: HttpErrorResponse) => {
					const errorObject = response.error.error;
					console.log(errorObject);
					this.error.set(errorObject.message);
					this.toastService.error('Failed to add member.');
				}
			});

		});
	}

	onCancel() { this.canceledMemberAdd.emit(); }

	resetForm() {
		this.memberModel.set({ userId: '' });
		this.memberForm().reset();
	}
}
