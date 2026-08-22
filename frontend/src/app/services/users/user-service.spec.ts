import { TestBed } from '@angular/core/testing';
import { UserService } from './user-service';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import type { UserDto } from '@shared/models/user';

describe('UserService', () => {
	let service: UserService;
	let httpMock: HttpTestingController;

	const userA: UserDto = {
		id: 1,
		username: 'john',
		email: 'john@email.com',
		avatarUrl: '/images/default-avatar.png'
	}

	const userB: UserDto = {
		id: 2,
		username: 'alice',
		email: 'alice@email.com',
		avatarUrl: '/images/default-avatar.png'
	}

	function setupService() {
		httpMock = TestBed.inject(HttpTestingController);
		service = TestBed.inject(UserService);
	};

	beforeEach(() => {
		vi.clearAllMocks();
		localStorage.clear();

		TestBed.configureTestingModule({
			providers: [
				provideHttpClient(),
				provideHttpClientTesting(),
			]
		});
	});

	it('should be created', () => {
		setupService();

		expect(service).toBeTruthy();
	});

	it('should get users', () => {
		const expectedResponse = [userA, userB];

		setupService();

		service.getUsers().subscribe(users => {
			expect(users).toEqual(expectedResponse);
		});

		const request = httpMock.expectOne('http://localhost:3000/api/users');
		expect(request.request.method).toBe('GET');
		request.flush(expectedResponse);
	});

	it('should get user by id', () => {
		const expectedResponse = userA;

		setupService();

		service.getUser(1).subscribe(user => {
			expect(user).toEqual(expectedResponse);
		});

		const request = httpMock.expectOne('http://localhost:3000/api/users/1');
		expect(request.request.method).toBe('GET');
		request.flush(expectedResponse);
	});
});
