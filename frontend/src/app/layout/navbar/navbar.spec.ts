import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Navbar } from './navbar';
import { AuthService } from '../../services/auth/auth-service';

describe('Navbar', () => {
	let component: Navbar;
	let fixture: ComponentFixture<Navbar>;

	let authServiceMock: {
		isLoggedIn: ReturnType<typeof vi.fn>,
		login: ReturnType<typeof vi.fn>
	};

	beforeEach(async () => {
		authServiceMock = {
			login: vi.fn(),
			isLoggedIn: vi.fn(),
		};

		await TestBed.configureTestingModule({
			imports: [Navbar],
			providers: [{ provide: AuthService, useValue: authServiceMock }]
		}).compileComponents();

		fixture = TestBed.createComponent(Navbar);
		component = fixture.componentInstance;
		await fixture.whenStable();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
