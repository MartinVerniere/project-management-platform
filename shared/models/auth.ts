import { UserDto } from "./user";

export interface LoginDto {
	token: string;
	user: UserDto;
}