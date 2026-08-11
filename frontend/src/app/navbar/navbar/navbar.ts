import { Component, inject, signal } from '@angular/core';
import { AuthService } from '../../services/auth/auth-service';
import { RouterLink } from '@angular/router';

@Component({
	selector: 'app-navbar',
	imports: [RouterLink],
	templateUrl: './navbar.html',
	styleUrl: './navbar.css',
})
export class Navbar {
	authService = inject(AuthService);

	avatarPreview = signal('/images/default-avatar.png');

	onLogout() {
		this.authService.logout()
	}
}
