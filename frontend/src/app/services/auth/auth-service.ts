import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { computed, inject, Service, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { LoginRequest, LoginResponse, RegisterRequest, RegisterResponse } from '../../models/auth';
import { UserResponse } from '../../models/user';

const API_URL = 'http://localhost:3000/api/auth';

@Service()
export class AuthService {
	private http: HttpClient = inject(HttpClient);
	private router: Router = inject(Router);

	private authToken = signal<string | null>(null);
	private currentUser = signal<UserResponse | null>(null);

	isLoggedIn = computed(() => !!this.authToken());
	user = this.currentUser.asReadonly();

	constructor() {
		const token: string | null = localStorage.getItem('authToken');
		this.authToken.set(token);
	}

	initializeAuth(): void {
		const token: string | null = this.authToken();

		if (!token) return;

		// If it has a token, check to which user it connects to, and set currentUser, and if token is expired log out
		this.me().subscribe({
			next: (user) => this.currentUser.set(user),
			error: (response: HttpErrorResponse) => {
				const errorObject = response.error.error;
				console.log(errorObject);
				this.logout();
			}
		});
	}

	login(request: LoginRequest): Observable<LoginResponse> {
		return this.http.post<LoginResponse>(`${API_URL}/login`, request)
			.pipe(tap((response: LoginResponse) => { this.setSession(response.token, response.user); }))
	}

	register(request: RegisterRequest): Observable<RegisterResponse> {
		return this.http.post<RegisterResponse>(`${API_URL}/register`, request);
	}

	me(): Observable<UserResponse> {
		return this.http.get<UserResponse>(`${API_URL}/me`);
	}

	logout() {
		this.authToken.set(null);
		this.currentUser.set(null);
		localStorage.removeItem('authToken');

		this.router.navigate(['/login']);
	}

	private setSession(token: string, user: UserResponse) {
		this.authToken.set(token);
		this.currentUser.set(user);

		localStorage.setItem('authToken', token);
	}

	getToken(): string | null { return this.authToken(); }
	getCurrentUser(): UserResponse | null { return this.currentUser(); }
}
