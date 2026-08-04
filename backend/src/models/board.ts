
export interface BoardResponse {
	id: number;
	name: string;
	projectId: number;
};

export interface FullBoardResponse {
	id: number;
	name: string;
	projectId: number;
	columns: {
		id: number;
		name: string;
		order: number;
		tasks: {
			id: number;
			title: string;
			description: string | null;
			order: number;
			assignee: {
				id: number;
				username: string;
				email: string;
			} | null;
			comments: {
				id: number;
				content: string;
				user: {
					id: number;
					username: string;
					email: string;
				};
			}[];
		}[];
	}[];
}