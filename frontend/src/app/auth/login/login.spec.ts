import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Login } from './login';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { of } from 'rxjs';
import { AuthService } from '../../services/auth/auth-service';
import { Component } from '@angular/core';

@Component({ standalone: true, template: '' }) class DummyComponent { }

describe('Login', () => {
	let component: Login;
	let harness: RouterTestingHarness;
	let router: Router;

	const authServiceMock = { login: vi.fn() };

	async function createComponent(shouldAwait: boolean = true) {
		component = await harness.navigateByUrl('/login', Login);

		if (shouldAwait) {
			await harness.fixture.whenStable();
			harness.detectChanges();
		};
	};

	function setDefaultMockReturnValues() {
		authServiceMock.login.mockReturnValue(of({ user: { id: '1', username: 'john', email: 'john@test.com' } }));
	};

	async function setHarnessAndRouter() {
		harness = await RouterTestingHarness.create();
		router = TestBed.inject(Router);
	};

	beforeEach(async () => {
		vi.clearAllMocks();

		setDefaultMockReturnValues();

		await TestBed.configureTestingModule({
			imports: [Login],
			providers: [
				{ provide: AuthService, useValue: authServiceMock },
				provideRouter([
					{ path: 'login', component: Login },
					{ path: '', component: DummyComponent },
				]),
			]
		}).compileComponents();

		await setHarnessAndRouter();
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

		await harness.fixture.whenStable();
		harness.detectChanges();

		expect(authServiceMock.login).toHaveBeenCalledWith({ username: 'john', password: '123' });
		expect(router.url).toBe('/');
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
