import { Router, type Request, type Response } from 'express';
import { ApiError, projectExtractor, requireProjectAdminRole, requireProjectMember, tokenExtractor, userExtractor } from '../utils/middleware.js';
import { prisma } from '../prisma.js';
import { ProjectRole } from '../generated/prisma/client.js';

const projectRouter = Router();

projectRouter.get('/', tokenExtractor, userExtractor, async (request: Request, response: Response) => {
	const userId = request.user.id;
	const filteredProjects = await prisma.project.findMany({
		where: {
			members: {
				some: {
					userId: userId
				}
			}
		}
	});

	return response.status(200).json(filteredProjects);
});

projectRouter.get('/:id', tokenExtractor, userExtractor, projectExtractor, requireProjectMember, async (request: Request, response: Response) => {
	const project = request.project;

	return response.status(200).json(project);
})

projectRouter.get('/:id/members', tokenExtractor, userExtractor, projectExtractor, requireProjectMember, async (request: Request, response: Response) => {
	const project = request.project!;
	const members = await prisma.projectMember.findMany({
		where: {
			projectId: project.id
		},
		include: {
			user: {
				select: {
					id: true,
					username: true,
					email: true
				}
			}
		}
	});

	return response.status(200).json(members);
});

projectRouter.post('/', tokenExtractor, userExtractor, async (request: Request, response: Response) => {
	const userId = request.user.id;
	const { name, key, description } = request.body;

	const projectKeyExists = await prisma.project.findUnique({ where: { key } });
	if (projectKeyExists) throw new ApiError(409, "PROJECT_KEY_EXISTS", "A project with this key already exists.");

	const newProject = await prisma.$transaction(async (tx) => {
		const project = await tx.project.create({
			data: {
				name,
				key,
				description
			}
		});

		await tx.projectMember.create({
			data: {
				userId: userId,
				projectId: project.id,
				role: ProjectRole.ADMIN
			}
		});

		return project;
	});

	return response.status(201).json(newProject);
});

projectRouter.post('/:id/members', tokenExtractor, userExtractor, projectExtractor, requireProjectMember, requireProjectAdminRole, async (request: Request, response: Response) => {
	const memberUserId = Number(request.body.userId);
	const project = request.project!;

	if (Number.isNaN(memberUserId)) throw new ApiError(400, "INVALID_USER_ID", "Invalid user id.");

	const user = await prisma.user.findUnique({ where: { id: memberUserId } });
	if (!user) throw new ApiError(404, "USER_NOT_FOUND", "No user found with the provided id.");

	const existingMembership = project.members.find(member => member.userId === memberUserId);
	if (existingMembership) throw new ApiError(409, "USER_ALREADY_PROJECT_MEMBER", "User is already a member of this project.");

	const newMember = await prisma.projectMember.create({
		data: {
			projectId: project.id,
			userId: memberUserId,
			role: ProjectRole.MEMBER
		}
	});

	return response.status(201).json(newMember);
});

projectRouter.delete('/:id/members/:userId', tokenExtractor, userExtractor, projectExtractor, requireProjectMember, requireProjectAdminRole, async (request: Request, response: Response) => {
	const memberUserId = Number(request.params.userId);
	if (Number.isNaN(memberUserId)) throw new ApiError(400, "INVALID_MEMBER_ID", "Invalid member id.");

	const project = request.project!;

	const member = project.members.find(member => member.userId === memberUserId);
	if (!member) throw new ApiError(404, "PROJECT_MEMBER_NOT_FOUND", "User is not a member of this project.");
	if (member.userId === request.user.id) throw new ApiError(400, "CANNOT_REMOVE_SELF", "You cannot remove yourself from the project.");

	await prisma.projectMember.delete({ where: { id: member.id } });

	return response.status(200).send();
});

projectRouter.put('/:id', tokenExtractor, userExtractor, projectExtractor, requireProjectMember, requireProjectAdminRole, async (request: Request, response: Response) => {
	const { name, description } = request.body;
	const project = request.project!;

	const updatedProject = await prisma.project.update({
		where: {
			id: project.id
		},
		data: {
			name,
			description: description.trim() === ''
				? null
				: description
		}
	});

	return response.status(200).json(updatedProject);
});

projectRouter.delete('/:id', tokenExtractor, userExtractor, projectExtractor, requireProjectMember, requireProjectAdminRole, async (request: Request, response: Response) => {
	const project = request.project!;

	await prisma.project.delete({ where: { id: project.id } })

	return response.status(200).send();
});

projectRouter.get("/:id/boards", tokenExtractor, userExtractor, projectExtractor, requireProjectMember, async (request: Request, response: Response) => {
	const project = request.project!;
	const boards = await prisma.board.findMany({ where: { projectId: project.id, } });

	return response.status(200).json(boards);
});

projectRouter.post("/:id/boards", tokenExtractor, userExtractor, projectExtractor, requireProjectMember, requireProjectAdminRole, async (request: Request, response: Response) => {
	const project = request.project!;

	const { name } = request.body;

	if (!name) throw new ApiError(400, "BOARD_NAME_REQUIRED", "Board name is required.");
	if (typeof name !== "string") throw new ApiError(400, "BOARD_NAME_INVALID", "Board name must be a string.");
	if (name.trim() === "") throw new ApiError(400, "BOARD_NAME_REQUIRED", "Board name is required.");

	const boardExists = await prisma.board.findUnique({ where: { projectId_name: { projectId: project.id, name } } });
	if (boardExists) throw new ApiError(409, "BOARD_EXISTS", "A board with this name already exists in the project.");

	const newBoard = await prisma.board.create({ data: { name: name, projectId: project.id } });

	return response.status(201).json(newBoard);
});

export default projectRouter;