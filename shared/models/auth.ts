import type { UserDto } from "./user.js";

export interface LoginDto {
	token: string;
	user: UserDto;
}