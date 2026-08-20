import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MemberList } from './member-list';
import { Component, input, output } from '@angular/core';
import { MemberElement } from '../member-element/member-element';
import { By } from '@angular/platform-browser';
import { MemberForm } from '../member-form/member-form';
import { AuthService } from '../../services/auth/auth-service';
import { of } from 'rxjs';
import type { ProjectMemberDto } from '@shared/models/project';
import type { UserDto } from '@shared/models/user';

@Component({
	selector: 'app-member-element',
	standalone: true,
	template: '',
})
class MemberElementStub {
	projectId = input.required<number>();
	member = input.required<ProjectMemberDto>();
	hasAdminPermissions = input.required<boolean>();

	memberRemoved = output<void>();
}

@Component({
	selector: 'app-member-form',
	standalone: true,
	template: '',
})
class MemberFormStub {
	projectId = input.required<number>();
	memberList = input.required<ProjectMemberDto[]>();

	memberAdded = output<void>();
	canceledMemberAdd = output<void>();
}

describe('MemberList', () => {
	let fixture: ComponentFixture<MemberList>;
	let component: MemberList;
	let html: HTMLElement;

	const authServiceMock = { user: vi.fn() };

	const me: UserDto = {
		id: 1,
		username: 'john',
		email: 'john@email.com',
		avatarUrl: '/images/default-avatar.png'
	}

	const memberList: ProjectMemberDto[] = [
		{
			id: 1,
			role: 'ADMIN',
			user: me
		},
		{
			id: 2,
			role: 'MEMBER',
			user: {
				id: 12,
				username: 'alice',
				email: 'alice@email.com',
				avatarUrl: '/images/default-avatar.png'
			}
		}
	];

	const projectId = 1;

	async function createComponent(shouldAwait = true, hasAdminPermissions = true) {
		fixture = TestBed.createComponent(MemberList);
		component = fixture.componentInstance;
		html = fixture.nativeElement;

		fixture.componentRef.setInput('projectId', projectId);
		fixture.componentRef.setInput('memberList', memberList);
		fixture.componentRef.setInput('hasAdminPermissions', hasAdminPermissions);

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
			providers: [
				{ provide: AuthService, useValue: authServiceMock }
			]
		}).overrideComponent(MemberList, {
			remove: { imports: [MemberElement, MemberForm] },
			add: { imports: [MemberElementStub, MemberFormStub] }
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

	it('should not render "Add member" button when user doesnt have add permissions', async () => {
		authServiceMock.user.mockReturnValue(of({
			id: 12,
			username: 'alice',
			email: 'alice@email.com',
			avatarUrl: '/images/default-avatar.png'
		}));

		await createComponent();

		const addButton = Array
			.from(html.querySelectorAll('button'))
			.find(button => button.textContent?.includes('Remove from project'));

		expect(addButton).toBeUndefined();
	})

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
