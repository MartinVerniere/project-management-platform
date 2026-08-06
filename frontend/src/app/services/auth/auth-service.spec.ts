import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { HttpTestingController, provideHttpClientTesting, TestRequest } from '@angular/common/http/testing';
import { AuthService } from './auth-service';
import { LoginResponse, RegisterResponse } from '../../models/auth';
import { UserResponse } from '../../models/user';

describe('AuthService', () => {
	let service: AuthService;
	let httpMock: HttpTestingController;

	const routerMock = { navigate: vi.fn() };

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

		httpMock = TestBed.inject(HttpTestingController);
		service = TestBed.inject(AuthService);
	});

	it('should be created', () => {
		expect(service).toBeTruthy();
	});

	it('should login correctly', () => {
		const expectedResponse: LoginResponse = {
			token: 'abc123',
			user: {
				id: 1,
				username: 'john',
				email: 'john@test.com',
			},
		};

		service.login({ username: 'john', password: '123' }).subscribe();

		const request: TestRequest = httpMock.expectOne('http://localhost:3000/api/auth/login');

		expect(request.request.method).toBe('POST');

		request.flush(expectedResponse);

		expect(service.getToken()).toBe('abc123');
		expect(service.getCurrentUser()?.username).toBe('john');
	});

	it('should register correctly', () => {
		const expectedResponse: RegisterResponse = {
			id: 1,
			username: 'john',
			email: 'john@test.com',
		};

		service.register({
			username: 'john',
			email: 'john@test.com',
			password: '123',
		}).subscribe();

		const request: TestRequest = httpMock.expectOne('http://localhost:3000/api/auth/register');

		request.flush(expectedResponse);
	});

	describe('When token exists in local storage', () => {
		beforeEach(() => {
			vi.clearAllMocks();

			localStorage.clear();
			localStorage.setItem('authToken', 'abc');

			TestBed.resetTestingModule();
			TestBed.configureTestingModule({
				providers: [
					provideHttpClient(),
					provideHttpClientTesting(),
					{ provide: Router, useValue: routerMock },
				]
			});

			httpMock = TestBed.inject(HttpTestingController);
			service = TestBed.inject(AuthService);
		});

		it('should logout correctly', () => {
			service.logout();

			expect(service.getToken()).toBe(null);
			expect(service.getCurrentUser()).toBe(null);
			expect(localStorage.getItem('authToken')).toBe(null);
			expect(routerMock.navigate).toHaveBeenCalledWith(['/login']);
		});

		it('should me correctly', () => {
			const expectedResponse: UserResponse = {
				id: 1,
				username: 'john',
				email: 'john@test.com',
			};

			service.me().subscribe();

			const request: TestRequest = httpMock.expectOne('http://localhost:3000/api/auth/me');

			expect(request.request.method).toBe('GET');

			request.flush(expectedResponse);
		});

		it('should set user on initializeAuth when token is valid', () => {
			const expectedResponse: UserResponse = {
				id: 1,
				username: 'john',
				email: 'john@test.com',
			};

			service.initializeAuth();

			const request: TestRequest = httpMock.expectOne('http://localhost:3000/api/auth/me');

			expect(request.request.method).toBe('GET');

			request.flush(expectedResponse);

			expect(service.getCurrentUser()?.username).toBe('john');
		});
	});

	describe('When token does not exists in local storage', () => {
		beforeEach(() => {
			vi.clearAllMocks();

			localStorage.clear();

			TestBed.resetTestingModule();
			TestBed.configureTestingModule({
				providers: [
					provideHttpClient(),
					provideHttpClientTesting(),
					{ provide: Router, useValue: routerMock },
				]
			});
		});

		it('should NOT set user on initializeAuth when no token exists', () => {
			service.initializeAuth();

			httpMock.expectNone('http://localhost:3000/api/auth/me');

			expect(service.getCurrentUser()).toBe(null);
		});
	});
});
