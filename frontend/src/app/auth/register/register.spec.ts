import { TestBed } from '@angular/core/testing';
import { Register } from './register';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { of } from 'rxjs';
import { AuthService } from '../../services/auth/auth-service';
import { Component } from '@angular/core';

@Component({ standalone: true, template: '' }) class DummyComponent { }

describe('Register', () => {
	let component: Register;
	let harness: RouterTestingHarness;
	let router: Router;

	const authServiceMock = { register: vi.fn() };

	async function createComponent(shouldAwait: boolean = true) {
		component = await harness.navigateByUrl('/register', Register);

		if (shouldAwait) {
			await harness.fixture.whenStable();
			harness.detectChanges();
		};
	};

	function setDefaultMockReturnValues() {
		authServiceMock.register.mockReturnValue(of({ id: '1', username: 'john', email: 'john@test.com' }));
	};

	async function setHarnessAndRouter() {
		harness = await RouterTestingHarness.create();
		router = TestBed.inject(Router);
	};

	beforeEach(async () => {
		vi.clearAllMocks();

		setDefaultMockReturnValues();

		await TestBed.configureTestingModule({
			imports: [Register],
			providers: [
				{ provide: AuthService, useValue: authServiceMock },
				provideRouter([
					{ path: 'register', component: Register },
					{ path: 'login', component: DummyComponent },
				]),
			]
		}).compileComponents();

		await setHarnessAndRouter();
	});

	it('should create', async () => {
		await createComponent();

		expect(component).toBeTruthy();
	});

	it('should register on submit', async () => {
		await createComponent();

		const avatar = new File(['avatar'], 'avatar.png', {
			type: 'image/png'
		});

		component.registerModel.set({
			username: 'john',
			email: 'john@test.com',
			password: '123',
			avatar: avatar
		});

		harness.detectChanges(); 
		await harness.fixture.whenStable();

		const registerButton = Array
			.from(harness.routeNativeElement!.querySelectorAll('button'))
			.find(button => button.textContent?.includes('Register'));

		expect(registerButton).toBeTruthy();

		registerButton!.click();

		await harness.fixture.whenStable();
		harness.detectChanges();

		expect(authServiceMock.register).toHaveBeenCalledTimes(1);
		const formData = authServiceMock.register.mock.calls[0][0];
		expect(formData).toBeInstanceOf(FormData);
		expect(formData.get('username')).toBe('john');
		expect(formData.get('email')).toBe('john@test.com');
		expect(formData.get('password')).toBe('123');
		expect(formData.get('avatar')).toBe(avatar);

		expect(router.url).toBe('/login');
	});

	it('should not submit when form is invalid', async () => {
		await createComponent();

		component.registerModel.set({
			username: '',
			email: '',
			password: '',
			avatar: null
		});

		harness.detectChanges(); 
		await harness.fixture.whenStable();

		const registerButton = Array
			.from(harness.routeNativeElement!.querySelectorAll('button'))
			.find(button => button.textContent?.includes('Register'));

		expect(registerButton).toBeTruthy();
		expect(registerButton!.disabled).toBe(true); 

		registerButton!.click();

		await harness.fixture.whenStable();
		harness.detectChanges();

		expect(authServiceMock.register).not.toHaveBeenCalled();
	});
});
