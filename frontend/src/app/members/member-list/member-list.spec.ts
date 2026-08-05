import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MemberList } from './member-list';
import { Component, input, output } from '@angular/core';
import { MemberElement } from '../member-element/member-element';
import { By } from '@angular/platform-browser';
import { MemberForm } from '../member-form/member-form';
import { ProjectMemberResponse } from '../../models/project';

@Component({
	selector: 'app-member-element',
	standalone: true,
	template: '',
})
class MemberElementStub {
	projectId = input.required<number>();
	member = input.required<ProjectMemberResponse>();

	memberRemoved = output<void>();
}

@Component({
	selector: 'app-member-form',
	standalone: true,
	template: '',
})
class MemberFormStub {
	projectId = input.required<number>();
	memberList = input.required<ProjectMemberResponse[]>();

	memberAdded = output<void>();
	canceledMemberAdd = output<void>();
}

describe('MemberList', () => {
	let fixture: ComponentFixture<MemberList>;
	let component: MemberList;

	const memberList: ProjectMemberResponse[] = [
		{
			id: 1,
			role: 'ADMIN',
			user: {
				id: 10,
				username: 'john',
				email: 'john@email.com'
			}
		},
		{
			id: 2,
			role: 'MEMBER',
			user: {
				id: 12,
				username: 'alice',
				email: 'alice@email.com'
			}
		}
	];

	const projectId = 1;

	async function createComponent(shouldAwait: boolean = true) {
		fixture = TestBed.createComponent(MemberList);
		component = fixture.componentInstance;

		fixture.componentRef.setInput('projectId', projectId);
		fixture.componentRef.setInput('memberList', memberList);

		fixture.detectChanges();

		if (shouldAwait) {
			await fixture.whenStable();
			fixture.detectChanges();
		}
	}

	beforeEach(async () => {
		vi.clearAllMocks();

		await TestBed.configureTestingModule({
			imports: [MemberList],
			providers: []
		}).overrideComponent(MemberList, {
			remove: {
				imports: [MemberElement, MemberForm],
			},
			add: {
				imports: [MemberElementStub, MemberFormStub],
			}
		}).compileComponents();
	});

	it('should create', async () => {
		await createComponent();

		expect(component).toBeTruthy();
	});

	it('should render members', async () => {
		await createComponent();

		const children = fixture.debugElement.queryAll(By.directive(MemberElementStub));

		expect(children).toHaveLength(2);
	});

	it('should enable add member form on click', async () => {
		await createComponent();

		component.onEnableAddMember();

		expect(component.addMemberFormEnabled()).toBe(true);
	});

	it('should disable add member form on cancel', async () => {
		await createComponent();

		component.onEnableAddMember();
		component.onCancelAddMember();

		expect(component.addMemberFormEnabled()).toBe(false);
	});

	it('should emit memberAdded when MemberForm emits memberAdded, and hide the form', async () => {
		await createComponent();

		component.onEnableAddMember();

		fixture.detectChanges();

		const child = fixture.debugElement
			.query(By.directive(MemberFormStub))
			.componentInstance as MemberFormStub;

		const emitSpy = vi.spyOn(component.memberAdded, 'emit');

		child.memberAdded.emit();

		expect(component.addMemberFormEnabled()).toBe(false);
		expect(emitSpy).toHaveBeenCalled();
	});

	it('should emit removeMember when MemberElement emits memberRemoved', async () => {
		await createComponent();

		const child = fixture.debugElement
			.query(By.directive(MemberElementStub))
			.componentInstance as MemberElementStub;

		const emitSpy = vi.spyOn(component.memberRemoved, 'emit');

		child.memberRemoved.emit();

		expect(emitSpy).toHaveBeenCalled();
	});
});
