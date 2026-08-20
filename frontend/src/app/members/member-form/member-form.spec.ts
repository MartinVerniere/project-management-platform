import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MemberForm } from './member-form';
import { of, throwError } from 'rxjs';
import { ProjectService } from '../../services/projects/project-service';
import { UserService } from '../../services/users/user-service';
import { ProjectMemberDto } from '@shared/models/project';
import { UserDto } from '@shared/models/user';

describe('MemberForm', () => {
	let fixture: ComponentFixture<MemberForm>;
	let component: MemberForm;

	const projectServiceMock = { addMember: vi.fn() };
	const userServiceMock = { getUsers: vi.fn() };

	const memberList: ProjectMemberDto[] = [
		{
			id: 1,
			role: 'ADMIN',
			user: {
				id: 10,
				username: 'john',
				email: 'john@email.com',
				avatarUrl: '/images/default-avatar.png'
			}
		}
	]

	const users: UserDto[] = [
		{
			id: 10,
			username: 'user',
			email: 'user@email.com',
			avatarUrl: '/images/default-avatar.png'
		},
		{
			id: 20,
			username: 'New user',
			email: 'newUser@email.com',
			avatarUrl: '/images/default-avatar.png'
		}
	];

	const projectId = 1;

	async function createComponent(shouldAwait: boolean = true) {
		fixture = TestBed.createComponent(MemberForm);
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

		userServiceMock.getUsers.mockReturnValue(of(users));

		await TestBed.configureTestingModule({
			imports: [MemberForm],
			providers: [
				{ provide: ProjectService, useValue: projectServiceMock },
				{ provide: UserService, useValue: userServiceMock },
			]
		}).compileComponents();
	});

	it('should create', async () => {
		await createComponent();

		expect(component).toBeTruthy();
	});

	it('should filter out users already in the project', async () => {
		await createComponent();

		expect(component.possibleUsers()).toEqual([{ id: 20, name: 'New User' }]);
	});

	it('should add member and emit memberAdded', async () => {
		projectServiceMock.addMember.mockReturnValue(of({}));

		await createComponent();

		const emitSpy = vi.spyOn(component.memberAdded, 'emit');

		component.memberModel.set({ userId: '20' });

		await component.onSubmit(new Event('submit'));

		expect(projectServiceMock.addMember).toHaveBeenCalledWith(1, 20);
		expect(emitSpy).toHaveBeenCalled();
		expect(component.memberModel()).toEqual({ userId: '' });
	});

	it('should set error when adding member fails', async () => {
		projectServiceMock.addMember.mockReturnValue(throwError(() => ({
			error: {
				error: {
					code: 'ERROR_MESSAGE',
					message: 'Error message'
				}
			}
		})));

		await createComponent();

		component.memberModel.set({ userId: '20' });

		await component.onSubmit(new Event('submit'));

		expect(component.error()).toBe('Error message');
	});

	it('should not add member when no user is selected', async () => {
		await createComponent();

		await component.onSubmit(new Event('submit'));

		expect(projectServiceMock.addMember).not.toHaveBeenCalled();
	});

	it('should emit canceledMemberAdd on cancel', async () => {
		await createComponent();

		const emitSpy = vi.spyOn(component.canceledMemberAdd, 'emit');

		component.onCancel();

		expect(emitSpy).toHaveBeenCalled();
	});
});
