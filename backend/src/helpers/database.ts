import { prisma } from '../../src/prisma.js';

export const clearDatabase = async () => {
	await prisma.task.deleteMany();
	await prisma.boardColumn.deleteMany();
	await prisma.board.deleteMany();
	await prisma.projectMember.deleteMany();
	await prisma.project.deleteMany();
	await prisma.user.deleteMany();
};