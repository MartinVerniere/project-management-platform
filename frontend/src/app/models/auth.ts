import { UserResponse } from "./user";

export interface LoginRequest {
	username: string;
	password: string;
}

export interface LoginResponse {
	token: string;
	user: UserResponse;
}

export interface RegisterRequest {
	username: string;
	email: string;
	password: string;
}

export type RegisterResponse = UserResponse;

