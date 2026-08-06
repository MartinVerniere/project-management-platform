import { Component, input, output, signal } from "@angular/core";
import { MemberForm } from "../member-form/member-form";
import { MemberElement } from "../member-element/member-element";
import { ProjectMemberResponse } from "../../models/project";

@Component({
	selector: 'app-member-list',
	imports: [MemberElement, MemberForm],
	templateUrl: './member-list.html',
	styleUrl: './member-list.css',
})
export class MemberList {
	projectId = input.required<number>();
	memberList = input.required<ProjectMemberResponse[]>();

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
