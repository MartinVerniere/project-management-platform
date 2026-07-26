import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MemberElement } from './member-element';
import { ProjectMember, ProjectService } from '../../services/projects/project-service';
import { of } from 'rxjs';

describe('MemberElement', () => {
	let fixture: ComponentFixture<MemberElement>;
	let component: MemberElement;
	let html: HTMLElement;

	let projectServiceMock = { removeMember: vi.fn() };

	const member: ProjectMember = {
		id: 1,
		role: 'MEMBER',

		user: {
			id: 1,
			username: 'john',
			email: 'john@email.com',
		}
	};

	const projectId: number = 1;

	async function createComponent(shouldAwait: boolean = true) {
		fixture = TestBed.createComponent(MemberElement);
		component = fixture.componentInstance;
		html = fixture.nativeElement;

		fixture.componentRef.setInput('member', member);
		fixture.componentRef.setInput('projectId', projectId);

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

	it('should remove member and emit removedMember when "Remove from project" button clicked', async () => {
		projectServiceMock.removeMember.mockReturnValue(of({}));

		await createComponent();

		const emitSpy = vi.spyOn(component.memberRemoved, 'emit');

		const removeMemberButton = Array
			.from(html.querySelectorAll('button'))
			.find(button => button.textContent?.includes('Remove from project'));

		expect(removeMemberButton).toBeTruthy();

		removeMemberButton!.click();

		await fixture.whenStable();

		expect(projectServiceMock.removeMember).toHaveBeenCalledWith(1, 1);
		expect(emitSpy).toHaveBeenCalled();
	});
});
