export interface UserResponse {
	id: number;
	username: string;
	email: string;
}

export interface LoginResponse {
	user: UserResponse;
	token: string;
}