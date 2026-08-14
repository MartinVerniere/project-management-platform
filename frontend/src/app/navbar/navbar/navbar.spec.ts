import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Navbar } from './navbar';
import { AuthService } from '../../services/auth/auth-service';
import { ActivatedRoute } from '@angular/router';

describe('Navbar', () => {
	let component: Navbar;
	let fixture: ComponentFixture<Navbar>;
	let html: HTMLElement;

	let authServiceMock = {
		isLoggedIn: vi.fn(),
		user: vi.fn(),
		logout: vi.fn()
	};

	const activatedRouteMock = {
		snapshot: {
			paramMap: {
				get: (key: string) => {
					return null;
				}
			}
		}
	};

	async function createComponent(shouldAwait = true) {
		fixture = TestBed.createComponent(Navbar);
		component = fixture.componentInstance;
		html = fixture.nativeElement;

		fixture.detectChanges();

		if (shouldAwait) {
			await fixture.whenStable();
			fixture.detectChanges();
		}
	}

	beforeEach(async () => {
		vi.clearAllMocks();

		await TestBed.configureTestingModule({
			imports: [Navbar],
			providers: [
				{ provide: AuthService, useValue: authServiceMock },
				{ provide: ActivatedRoute, useValue: activatedRouteMock }
			]
		}).compileComponents();
	});

	it('should create', async () => {
		await createComponent();

		expect(component).toBeTruthy();
	});

	it('should render "Login" and "Register" buttons when user is not logged in', async () => {
		authServiceMock.isLoggedIn.mockReturnValue(false);

		await createComponent();

		const loginButton = Array
			.from(html.querySelectorAll('button'))
			.find(button => button.textContent?.includes('Login'));

		const registerButton = Array
			.from(html.querySelectorAll('button'))
			.find(button => button.textContent?.includes('Register'));

		const logoutButton = Array
			.from(html.querySelectorAll('button'))
			.find(button => button.textContent?.includes('Logout'));

		expect(loginButton).toBeTruthy();
		expect(registerButton).toBeTruthy();
		expect(logoutButton).toBeUndefined();
	});

	it('should render "Logout" button when user is logged in', async () => {
		authServiceMock.isLoggedIn.mockReturnValue(true);
		authServiceMock.user.mockReturnValue({
			id: 1,
			username: 'john',
			email: 'john@test.com',
			avatarUrl: '/images/john.png'
		});

		await createComponent();

		const loginButton = Array
			.from(html.querySelectorAll('button'))
			.find(button => button.textContent?.includes('Login'));

		const registerButton = Array
			.from(html.querySelectorAll('button'))
			.find(button => button.textContent?.includes('Register'));

		const logoutButton = Array
			.from(html.querySelectorAll('button'))
			.find(button => button.textContent?.includes('Logout'));

		expect(loginButton).toBeUndefined();
		expect(registerButton).toBeUndefined();
		expect(logoutButton).toBeTruthy();
	});

	it('should logout when clicking "Logout" button', async () => {
		authServiceMock.isLoggedIn.mockReturnValue(true);
		authServiceMock.user.mockReturnValue({
			id: 1,
			username: 'john',
			email: 'john@test.com',
			avatarUrl: '/images/john.png'
		});

		await createComponent();

		const logoutButton = Array
			.from(html.querySelectorAll('button'))
			.find(button => button.textContent?.includes('Logout'));

		expect(logoutButton).toBeTruthy();

		logoutButton!.click();

		expect(authServiceMock.logout).toHaveBeenCalled();
	});
});
