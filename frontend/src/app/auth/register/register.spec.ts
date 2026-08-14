import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Register } from './register';
import { provideRouter, Router } from '@angular/router';
import { of } from 'rxjs';
import { AuthService } from '../../services/auth/auth-service';

describe('Register', () => {
	let fixture: ComponentFixture<Register>;
	let component: Register;
	let router: Router;
	let navigateSpy: any;

	let authServiceMock: { register: ReturnType<typeof vi.fn> }; // Injected service

	beforeEach(async () => {
		authServiceMock = { register: vi.fn() }

		await TestBed.configureTestingModule({
			imports: [Register],
			providers: [
				{ provide: AuthService, useValue: authServiceMock },
				provideRouter([])
			]
		}).compileComponents();
		
		router = TestBed.inject(Router);
		navigateSpy = vi.spyOn(router, 'navigate');

		fixture = TestBed.createComponent(Register);
		component = fixture.componentInstance;

		await fixture.whenStable();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});

	it('should register on submit', () => {
		authServiceMock.register.mockReturnValue(of({
			id: '1',
			username: 'john',
			email: 'john@test.com',
		}));

		const avatar = new File(['avatar'], 'avatar.png', {
			type: 'image/png'
		});

		component.registerModel.set({
			username: 'john',
			email: 'john@test.com',
			password: '123',
			avatar: avatar
		});

		component.onSubmit(new Event('submit'));

		expect(authServiceMock.register).toHaveBeenCalledTimes(1);
		const formData = authServiceMock.register.mock.calls[0][0];

		expect(formData).toBeInstanceOf(FormData);
		expect(formData.get('username')).toBe('john');
		expect(formData.get('email')).toBe('john@test.com');
		expect(formData.get('password')).toBe('123');
		expect(formData.get('avatar')).toBe(avatar);
	
		expect(navigateSpy).toHaveBeenCalledWith(['/login']);
	});

	it('should not submit when form is invalid', () => {
		component.registerModel.set({
			username: '',
			email: '',
			password: '',
			avatar: null
		});

		component.onSubmit(new Event('submit'));

		expect(authServiceMock.register).not.toHaveBeenCalled();
	});
});
