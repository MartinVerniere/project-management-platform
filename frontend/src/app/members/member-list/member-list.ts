import { Component, computed, inject, input, output, signal } from "@angular/core";
import { MemberForm } from "../member-form/member-form";
import { MemberElement } from "../member-element/member-element";
import { AuthService } from "../../services/auth/auth-service";
import { ProjectMemberDto } from "@shared/models/project";

@Component({
	selector: 'app-member-list',
	imports: [MemberElement, MemberForm],
	templateUrl: './member-list.html',
	styleUrl: './member-list.css',
})
export class MemberList {
	authService = inject(AuthService);

	projectId = input.required<number>();
	memberList = input.required<ProjectMemberDto[]>();
	hasAdminPermissions = input.required<boolean>();

	memberAdded = output<void>();
	memberRemoved = output<void>();

	addMemberFormEnabled = signal<boolean>(false);
	error = signal<string | null>(null);

	hasAddPermission = computed(() => {
		const userId = this.authService.user()?.id;

		if (!userId) return false;

		return this.memberList().some(member => member.user.id === userId && member.role === 'ADMIN');
	});

	onEnableAddMember() { this.addMemberFormEnabled.set(true); }
	onCancelAddMember() { this.addMemberFormEnabled.set(false); }

	onMemberAdded() {
		this.addMemberFormEnabled.set(false);
		this.memberAdded.emit();
	}

	onMemberRemoved() {
		this.memberRemoved.emit();
	}
}
