import { prisma } from '../../src/prisma.js';

export const NOT_FOUND_ID = 2147483647;
export const INVALID_ID = 'abc';

export const clearDatabase = async () => {
	await prisma.task.deleteMany();
	await prisma.boardColumn.deleteMany();
	await prisma.board.deleteMany();
	await prisma.projectMember.deleteMany();
	await prisma.project.deleteMany();
	await prisma.user.deleteMany();
};