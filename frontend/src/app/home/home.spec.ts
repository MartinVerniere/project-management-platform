import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Home } from './home';
import { provideRouter } from '@angular/router';
import { Health } from '../services/health';
import { of } from 'rxjs';

describe('Home', () => {
	let fixture: ComponentFixture<Home>;
	let component: Home;
	let html: HTMLElement;

	let healthServiceMock = { getHealthStatus: vi.fn() };

	function setDefaultReturnValues() {
		healthServiceMock.getHealthStatus.mockReturnValue(of({}));
	};

	async function createComponent(shouldAwait = true) {
		fixture = TestBed.createComponent(Home);
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

		setDefaultReturnValues();

		await TestBed.configureTestingModule({
			imports: [Home],
			providers: [
				{ provide: Health, useValue: healthServiceMock },
				provideRouter([])
			],
		}).compileComponents();
	});

	it('should create', async () => {
		await createComponent();

		expect(component).toBeTruthy();
	});
});
