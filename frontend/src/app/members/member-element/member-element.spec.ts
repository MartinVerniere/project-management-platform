import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MemberElement } from './member-element';
import { ProjectService } from '../../services/projects/project-service';
import { of } from 'rxjs';
import type { UserDto } from '@shared/models/user';
import type { ProjectMemberDto } from '@shared/models/project';

describe('MemberElement', () => {
	let fixture: ComponentFixture<MemberElement>;
	let component: MemberElement;
	let html: HTMLElement;

	let projectServiceMock = { removeMember: vi.fn() };

	const me: UserDto = {
		id: 1,
		username: 'john',
		email: 'john@email.com',
		avatarUrl: '/images/default-avatar.png'
	};

	const member: ProjectMemberDto = {
		id: 1,
		role: 'ADMIN',
		user: me
	};

	const projectId: number = 1;

	async function createComponent(shouldAwait = true, hasAdminPermissions = true) {
		fixture = TestBed.createComponent(MemberElement);
		component = fixture.componentInstance;
		html = fixture.nativeElement;

		fixture.componentRef.setInput('member', member);
		fixture.componentRef.setInput('projectId', projectId);
		fixture.componentRef.setInput('hasAdminPermissions', hasAdminPermissions);

		fixture.detectChanges();

		if (shouldAwait) {
			await fixture.whenStable();
			fixture.detectChanges();
		}
	};

	function setDefaultReturnValues() {
		projectServiceMock.removeMember.mockReturnValue(of({}));
	};

	beforeEach(async () => {
		vi.clearAllMocks();

		setDefaultReturnValues();

		await TestBed.configureTestingModule({
			imports: [MemberElement],
			providers: [
				{ provide: ProjectService, useValue: projectServiceMock },
			]
		}).compileComponents();
	});

	it('should create', async () => {
		await createComponent();

		expect(component).toBeTruthy();
	});

	it('should render member information', async () => {
		await createComponent();

		expect(html.textContent).toContain('john');
	});

	it('should not render "Remove" button when user doesnt have admin permissions', async () => {
		await createComponent(true, false);

		const removeButton = Array
			.from(html.querySelectorAll('button'))
			.find(button => button.textContent?.includes('Remove from project'));

		expect(removeButton).toBeUndefined();
	})

	it('should remove member and emit removedMember when "Remove" button clicked', async () => {
		await createComponent();

		const emitSpy = vi.spyOn(component.memberRemoved, 'emit');

		const removeButton = Array
			.from(html.querySelectorAll('button'))
			.find(button => button.textContent?.includes('Remove'));

		expect(removeButton).toBeTruthy();

		removeButton!.click();
		await fixture.whenStable();

		expect(projectServiceMock.removeMember).toHaveBeenCalledWith(1, 1);
		expect(emitSpy).toHaveBeenCalled();
	});
});
