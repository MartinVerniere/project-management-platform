import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Toast } from './toast';
import { ToastService } from '../services/toast/toast-service';

describe('Toast', () => {
	let component: Toast;
	let fixture: ComponentFixture<Toast>;

	let toastServiceMock = {
		toasts: vi.fn(),
		remove: vi.fn()
	};

	async function createComponent(shouldAwait = true) {
		fixture = TestBed.createComponent(Toast);
		component = fixture.componentInstance;

		fixture.detectChanges();

		if (shouldAwait) {
			await fixture.whenStable();
			fixture.detectChanges();
		};
	};

	function setDefaultReturnValues() {
		toastServiceMock.toasts = vi.fn().mockReturnValue([
			{
				id: 1,
				message: 'Test toast',
				type: 'success'
			}
		]);
		toastServiceMock.remove.mockReturnValue({});
	};

	beforeEach(async () => {
		vi.clearAllMocks();

		setDefaultReturnValues();

		await TestBed.configureTestingModule({
			imports: [Toast],
			providers: [
				{ provide: ToastService, useValue: toastServiceMock },
			],
		}).compileComponents();
	});

	it('should create', async () => {
		await createComponent();

		expect(component).toBeTruthy();
	});

	it('should remove toast on cancel button click', async () => {
		await createComponent();

		const button = fixture.nativeElement.querySelector('.toast button') as HTMLButtonElement;
		button.click();

		expect(toastServiceMock.remove).toHaveBeenCalledWith(1);
	});
});
