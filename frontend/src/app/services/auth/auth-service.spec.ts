import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { HttpTestingController, provideHttpClientTesting, TestRequest } from '@angular/common/http/testing';
import { AuthService } from './auth-service';
import type { LoginDto } from '@shared/models/auth';
import type { UserDto } from '@shared/models/user';

describe('AuthService', () => {
	let service: AuthService;
	let httpMock: HttpTestingController;

	const routerMock = { navigate: vi.fn() };

	function setupService() {
		httpMock = TestBed.inject(HttpTestingController);
		service = TestBed.inject(AuthService);
	}

	beforeEach(() => {
		vi.clearAllMocks();
		localStorage.clear();

		TestBed.configureTestingModule({
			providers: [
				provideHttpClient(),
				provideHttpClientTesting(),
				{ provide: Router, useValue: routerMock },
			]
		});
	});

	it('should be created', () => {
		setupService();
		expect(service).toBeTruthy();
	});

	it('should login correctly', () => {
		const expectedResponse: LoginDto = {
			token: 'abc123',
			user: {
				id: 1,
				username: 'john',
				email: 'john@test.com',
				avatarUrl: '/images/default-avatar.png'
			},
		};

		setupService();

		service.login({ username: 'john', password: '123' }).subscribe();

		const request: TestRequest = httpMock.expectOne('http://localhost:3000/api/auth/login');
		expect(request.request.method).toBe('POST');
		request.flush(expectedResponse);

		expect(service.getToken()).toBe('abc123');
		expect(service.getCurrentUser()?.username).toBe('john');
	});

	it('should register correctly', () => {
		const expectedResponse: UserDto = {
			id: 1,
			username: 'john',
			email: 'john@test.com',
			avatarUrl: '/images/default-avatar.png'
		};

		setupService();

		let formData = new FormData();
		formData.append('username', 'john');
		formData.append('email', 'john@test.com');
		formData.append('password', '123');

		service.register(formData).subscribe();

		const request: TestRequest = httpMock.expectOne('http://localhost:3000/api/auth/register');
		expect(request.request.method).toBe('POST');
		expect(request.request.body).toBe(formData); 
		request.flush(expectedResponse);
	});

	describe('When token exists in local storage', () => {
		beforeEach(() => {
			localStorage.clear();
			localStorage.setItem('authToken', 'abc');
		});

		it('should logout correctly', () => {
			setupService();

			service.logout();

			expect(service.getToken()).toBe(null);
			expect(service.getCurrentUser()).toBe(null);
			expect(localStorage.getItem('authToken')).toBe(null);
			expect(routerMock.navigate).toHaveBeenCalledWith(['/login']);
		});

		it('should me correctly', () => {
			const expectedResponse: UserDto = {
				id: 1,
				username: 'john',
				email: 'john@test.com',
				avatarUrl: '/images/default-avatar.png'
			};

			setupService();

			service.me().subscribe();

			const request: TestRequest = httpMock.expectOne('http://localhost:3000/api/auth/me');
			expect(request.request.method).toBe('GET');
			request.flush(expectedResponse);
		});

		it('should set user on initializeAuth when token is valid', () => {
			const expectedResponse: UserDto = {
				id: 1,
				username: 'john',
				email: 'john@test.com',
				avatarUrl: '/images/default-avatar.png'
			};
			
			setupService();

			service.initializeAuth();

			const request: TestRequest = httpMock.expectOne('http://localhost:3000/api/auth/me');
			expect(request.request.method).toBe('GET');
			request.flush(expectedResponse);

			expect(service.getCurrentUser()?.username).toBe('john');
		});
	});

	describe('When token does not exists in local storage', () => {
		beforeEach(() => {
			localStorage.clear();
		});

		it('should NOT set user on initializeAuth when no token exists', () => {
			setupService();

			service.initializeAuth();

			httpMock.expectNone('http://localhost:3000/api/auth/me');
			expect(service.getCurrentUser()).toBe(null);
		});
	});
});
