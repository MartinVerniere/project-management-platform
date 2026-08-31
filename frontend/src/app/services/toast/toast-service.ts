import { Service } from '@angular/core';
import { signal } from '@angular/core';
import { Toast } from '../../models/toast';
import { ToastType } from '../../models/toast';

@Service()
export class ToastService {
	private nextId = 0;

	toasts = signal<Toast[]>([]);

	show(message: string, type: ToastType = 'info') {
		const id = this.nextId++;

		this.toasts.update(toasts => [
			...toasts,
			{ id, message, type }
		]);

		setTimeout(() => { this.remove(id); }, 3000);
	}

	remove(id: number) {
		this.toasts.update(toasts => toasts.filter(toast => toast.id !== id));
	}

	success(message: string) {
		this.show(message, 'success');
	}

	error(message: string) {
		this.show(message, 'error');
	}

	info(message: string) {
		this.show(message, 'info');
	}
}