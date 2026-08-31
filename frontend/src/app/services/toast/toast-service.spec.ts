import { TestBed } from '@angular/core/testing';
import { ToastService } from './toast-service';
import { vi } from 'vitest';

describe('ToastService', () => {
	let service: ToastService;

	function setupService() {
		service = TestBed.inject(ToastService);
		vi.useFakeTimers();
	};

	beforeEach(() => {
		TestBed.configureTestingModule({});
	});

	it('should be created', () => {
		setupService();

		expect(service).toBeTruthy();
	});

	it('should add an info toast by default', () => {
		setupService();

		service.show('Test message');

		expect(service.toasts()).toHaveLength(1);
		expect(service.toasts()[0]).toEqual({ id: 0, message: 'Test message', type: 'info' });
	});

	it('should add a toast with the given type', () => {
		setupService();

		service.show('Success!', 'success');

		expect(service.toasts()[0]).toEqual({ id: 0, message: 'Success!', type: 'success' });
	});

	it('should remove a toast', () => {
		setupService();

		service.show('First');
		service.show('Second');

		const firstId = service.toasts()[0].id;

		service.remove(firstId);

		expect(service.toasts()).toHaveLength(1);
		expect(service.toasts()[0].message).toBe('Second');
	});

	it('should automatically remove a toast after 3 seconds', () => {
		setupService();

		service.show('Temporary');

		expect(service.toasts()).toHaveLength(1);

		vi.advanceTimersByTime(3000);

		expect(service.toasts()).toHaveLength(0);
	});

	it('success() should create a success toast', () => {
		setupService();

		service.success('Saved successfully');

		expect(service.toasts()[0]).toMatchObject({ message: 'Saved successfully', type: 'success' });
	});

	it('error() should create an error toast', () => {
		setupService();

		service.error('Something went wrong');

		expect(service.toasts()[0]).toMatchObject({ message: 'Something went wrong', type: 'error' });
	});

	it('info() should create an info toast', () => {
		setupService();

		service.info('Some information');

		expect(service.toasts()[0]).toMatchObject({ message: 'Some information', type: 'info' });
	});

	it('should give each toast a unique id', () => {
		setupService();

		service.show('First');
		service.show('Second');

		expect(service.toasts()[0].id).not.toBe(service.toasts()[1].id);
	});

	afterEach(() => {
		vi.useRealTimers();
	});
});