import { TaskDto } from "./task";

export interface ColumnDto {
	id: number,
	name: string
	boardId: number,
	order: number,
}

export interface ColumnDetailsDto extends ColumnDto {
	tasks: TaskDto[]
}