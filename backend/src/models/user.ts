export interface UserResponse {
	id: number;
	username: string;
	email: string;
	avatarUrl: string | null;
}

export interface LoginResponse {
	user: UserResponse;
	token: string;
}

export type RegisterResponse = UserResponse;