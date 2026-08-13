import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MemberElement } from './member-element';
import { ProjectService } from '../../services/projects/project-service';
import { of } from 'rxjs';
import { ProjectMemberResponse } from '../../models/project';
import { UserResponse } from '../../models/user';
import { AuthService } from '../../services/auth/auth-service';

describe('MemberElement', () => {
	let fixture: ComponentFixture<MemberElement>;
	let component: MemberElement;
	let html: HTMLElement;

	let projectServiceMock = { removeMember: vi.fn() };
	let authServiceMock = { user: vi.fn() };

	const me: UserResponse = {
		id: 1,
		username: 'john',
		email: 'john@email.com',
		avatarUrl: '/images/default-avatar.png'
	}

	const member: ProjectMemberResponse = {
		id: 1,
		role: 'ADMIN',
		user: {
			id: 1,
			username: 'john',
			email: 'john@email.com',
			avatarUrl: '/images/default-avatar.png'
		}
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
	}


	beforeEach(async () => {
		vi.clearAllMocks();

		await TestBed.configureTestingModule({
			imports: [MemberElement],
			providers: [
				{ provide: ProjectService, useValue: projectServiceMock },
				{ provide: AuthService, useValue: authServiceMock },
			]
		}).compileComponents();
	});

	it('should create', async () => {
		authServiceMock.user.mockReturnValue(me);
		projectServiceMock.removeMember.mockReturnValue(of({}));

		await createComponent();

		expect(component).toBeTruthy();
	});

	it('should render member information', async () => {
		authServiceMock.user.mockReturnValue(me);
		projectServiceMock.removeMember.mockReturnValue(of({}));

		await createComponent();

		expect(html.textContent).toContain('john');
	});

	it('should not render "Remove" button when user doesnt have admin permissions', async () => {
		authServiceMock.user.mockReturnValue({
			id: 2,
			username: 'alice',
			email: 'alice@email.com',
			avatarUrl: '/images/default-avatar.png'
		});

		await createComponent();

		const removeButton = Array
			.from(html.querySelectorAll('button'))
			.find(button => button.textContent?.includes('Remove from project'));

		expect(removeButton).toBeUndefined();
	})

	it('should remove member and emit removedMember when "Remove" button clicked', async () => {
		authServiceMock.user.mockReturnValue(me);
		projectServiceMock.removeMember.mockReturnValue(of({}));

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
