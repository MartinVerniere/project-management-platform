import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AppLayout } from './app-layout';
import { Component } from '@angular/core';
import { Navbar } from '../../navbar/navbar/navbar';
import { provideRouter } from '@angular/router';

@Component({
	selector: 'app-navbar',
	standalone: true,
	template: ''
})
class NavbarStub { }

describe('AppLayout', () => {
	let fixture: ComponentFixture<AppLayout>;
	let component: AppLayout;
	let html: HTMLElement;

	async function createComponent(shouldAwait = true) {
		fixture = TestBed.createComponent(AppLayout);
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

		await TestBed.configureTestingModule({
			imports: [AppLayout],
			providers: [
				provideRouter([])
			]
		}).overrideComponent(AppLayout, {
			remove: { imports: [Navbar] },
			add: { imports: [NavbarStub] }
		}).compileComponents();
	});


	it('should render navbar', async () => {
		await createComponent();

		expect(html.querySelector('app-navbar')).toBeTruthy();
	});

	it('should render router outlet', async () => {
		await createComponent();

		expect(html.querySelector('router-outlet')).toBeTruthy();
	});
});
