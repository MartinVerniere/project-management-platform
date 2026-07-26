import { Component, input, inject, output, signal } from "@angular/core";
import { Project, ProjectMember, ProjectService } from "../../services/projects/project-service";
import { MemberForm } from "../member-form/member-form";
import { MemberElement } from "../member-element/member-element";

@Component({
	selector: 'app-member-list',
	imports: [MemberElement,MemberForm],
	templateUrl: './member-list.html',
	styleUrl: './member-list.css',
})
export class MemberList {
	projectService = inject(ProjectService);

	projectId = input.required<number>();
	memberList = input.required<ProjectMember[]>();

	memberAdded = output<void>();
	memberRemoved = output<void>();

	addMemberFormEnabled = signal<boolean>(false);
	error = signal<string | null>(null);

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
