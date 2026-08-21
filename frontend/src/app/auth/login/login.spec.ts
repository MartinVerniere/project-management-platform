import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Login } from './login';
import { provideRouter, Router } from '@angular/router';
import { of } from 'rxjs';
import { AuthService } from '../../services/auth/auth-service';

describe('Login', () => {
	let fixture: ComponentFixture<Login>;
	let component: Login;
	let router: Router;
	let navigateSpy: ReturnType<typeof vi.spyOn>;

	const authServiceMock = { login: vi.fn() };

	async function createComponent(shouldAwait: boolean = true) {
		fixture = TestBed.createComponent(Login);
		component = fixture.componentInstance;

		fixture.detectChanges();

		if (shouldAwait) {
			await fixture.whenStable();
			fixture.detectChanges();
		}
	};

	function setDefaultMockReturnValues() {
		authServiceMock.login.mockReturnValue(of({
			user: {
				id: '1',
				username: 'john',
				email: 'john@test.com'
			}
		}));
	};

	function setupRouter() {
		router = TestBed.inject(Router);
		navigateSpy = vi.spyOn(router, 'navigate');
	};

	beforeEach(async () => {
		vi.clearAllMocks();

		setDefaultMockReturnValues();

		await TestBed.configureTestingModule({
			imports: [Login],
			providers: [
				{ provide: AuthService, useValue: authServiceMock },
				provideRouter([]),
			]
		}).compileComponents();

		setupRouter();
	});

	it('should create', async () => {
		await createComponent();

		expect(component).toBeTruthy();
	});

	it('should login on submit', async () => {
		await createComponent();

		component.loginModel.set({
			username: 'john',
			password: '123',
		});

		component.onSubmit(new Event('submit'));

		expect(authServiceMock.login).toHaveBeenCalledWith({
			username: 'john',
			password: '123',
		});

		expect(navigateSpy).toHaveBeenCalledWith(['/']);
	});

	it('should not submit when form is invalid', async () => {
		await createComponent();

		component.loginModel.set({
			username: '',
			password: '',
		});

		component.onSubmit(new Event('submit'));

		expect(authServiceMock.login).not.toHaveBeenCalled();
	});
});
