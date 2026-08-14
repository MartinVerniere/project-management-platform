import { TestBed } from '@angular/core/testing';
import { UserService } from './user-service';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { UserResponse } from '../../models/user';

const userA = {
	id: 1,
	username: 'john',
	email: 'john@email.com',
	avatarUrl: '/images/default-avatar.png'
}

const userB = {
	id: 2,
	username: 'alice',
	email: 'alice@email.com',
	avatarUrl: '/images/default-avatar.png'
}

describe('UserService', () => {
	let service: UserService;
	let httpMock: HttpTestingController;

	beforeEach(() => {
		vi.clearAllMocks();
		localStorage.clear();

		TestBed.configureTestingModule({
			providers: [
				provideHttpClient(),
				provideHttpClientTesting(),
			]
		});

		httpMock = TestBed.inject(HttpTestingController);
		service = TestBed.inject(UserService);
	});

	it('should be created', () => {
		expect(service).toBeTruthy();
	});

	it('should get users', () => {
		const expectedResponse: UserResponse[] = [userA, userB];

		service.getUsers().subscribe(users => { expect(users).toEqual(expectedResponse); });

		const request = httpMock.expectOne('http://localhost:3000/api/users');

		expect(request.request.method).toBe('GET');

		request.flush(expectedResponse);
	});

	it('should get user by id', () => {
		const expectedResponse: UserResponse = userA;

		service.getUser(1).subscribe(user => { expect(user).toEqual(expectedResponse); });

		const request = httpMock.expectOne('http://localhost:3000/api/users/1');

		expect(request.request.method).toBe('GET');

		request.flush(expectedResponse);
	});

	afterEach(() => {
		httpMock.verify();
	});
});
