import type { ColumnDetailsDto } from "./column.js";

export interface BoardDto {
	id: number,
	name: string,
	projectId: number,
}

export interface BoardDetailsDto extends BoardDto {
	columns: ColumnDetailsDto[]
}