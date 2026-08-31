import { Service } from '@angular/core';
import { Injectable, signal } from '@angular/core';

export type ToastType = 'success' | 'error' | 'info';

export interface Toast {
	id: number;
	message: string;
	type: ToastType;
}

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