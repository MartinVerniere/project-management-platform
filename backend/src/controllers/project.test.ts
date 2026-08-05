import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';

import { prisma } from '../prisma.js';
import { app } from '../app.js';
import { ProjectRole } from '../generated/prisma/client.js';
import { clearDatabase, INVALID_ID, NOT_FOUND_ID } from '../helpers/database.js';
import { registerUser, loginUser, createProject, addMember, createBoard } from '../helpers/test.js';

describe('Project API', () => {
	beforeEach(async () => {
		await clearDatabase();
	});

	describe('when a user is logged in', () => {
		let authToken: string;
		let johnId: number;
		let aliceId: number;
		let martinId: number;

		beforeEach(async () => {
			//Create users
			const john = await registerUser('john', 'john@test.com', 'password123');
			johnId = john.id;
			const alice = await registerUser('alice', 'alice@test.com', 'password123');
			aliceId = alice.id;
			const martin = await registerUser('martin', 'martin@test.com', 'password123');
			martinId = martin.id;

			//Login
			const login = await loginUser('john', 'password123');
			authToken = login.token;
		});

		describe('on create project', () => {
			it('creates a project', async () => {
				const response = await request(app)
					.post(`/api/projects`)
					.set('Authorization', `Bearer ${authToken}`)
					.send({
						name: 'Test 1',
						key: 'TEST1',
						description: 'test desc'
					});

				expect(response.status).toBe(201);
				expect(response.body.key).toBe('TEST1');

				const projects = await prisma.project.findMany();

				expect(projects).toHaveLength(1);
				expect(projects[0]!.key).toBe("TEST1");
			});

			it('adds the creator as an ADMIN member', async () => {
				const response = await request(app)
					.post(`/api/projects`)
					.set('Authorization', `Bearer ${authToken}`)
					.send({
						name: 'Test 1',
						key: 'TEST1',
						description: 'test desc'
					});

				const createdProjectId = response.body.id;

				const member = await prisma.projectMember.findFirst({
					where: {
						projectId: createdProjectId
					}
				});

				expect(member).not.toBeNull();
				expect(member?.role).toBe(ProjectRole.ADMIN);
			});

			it('returns 401 if token is invalid', async () => {
				const response = await request(app)
					.post(`/api/projects`)
					.set('Authorization', `Bearer INVALID_TOKEN`)
					.send({ name: 'Test 1', key: 'TEST1', description: 'test desc' });

				expect(response.status).toBe(401);
				expect(response.body.error.message).toBe("Authentication token is invalid.");
			});

			it('returns 401 if token is missing', async () => {
				const response = await request(app)
					.post(`/api/projects`)
					.send({ name: 'Test 1', key: 'TEST1', description: 'test desc' });

				expect(response.status).toBe(401);
				expect(response.body.error.message).toBe("Authentication token is missing.");
			});
		});

		describe('when a project exists in the database', () => {
			let projectId: number;

			beforeEach(async () => {
				//Create project
				const project = await createProject(authToken, 'Test 1', 'TEST1', 'test desc');
				projectId = project.id;

				//Add member to project
				const member = await addMember(authToken, projectId, aliceId);
			});

			describe('on create project', () => {
				it('returns 409 when new project key already exists in database', async () => {
					const response = await request(app)
						.post(`/api/projects`)
						.set('Authorization', `Bearer ${authToken}`)
						.send({ name: 'Test 1', key: 'TEST1', description: 'test desc' });

					expect(response.status).toBe(409);
					expect(response.body.error.message).toBe('A project with this key already exists.');
				});
			});

			describe('and ADMIN is logged in', async () => {
				beforeEach(async () => {
					const admin = await loginUser('john', 'password123');
					authToken = admin.token;
				});

				describe('on update project', () => {
					it('updates the project', async () => {
						const response = await request(app)
							.put(`/api/projects/${projectId}`)
							.set('Authorization', `Bearer ${authToken}`)
							.send({ name: 'Test 1', description: 'UPDATED desc' });

						expect(response.status).toBe(200);
						expect(response.body.description).toBe('UPDATED desc');

						const updated = await prisma.project.findUnique({ where: { id: projectId } });

						expect(updated?.description).toBe("UPDATED desc");
					});

					it('returns 400 if invalid project id', async () => {
						const response = await request(app)
							.put(`/api/projects/${INVALID_ID}`)
							.set('Authorization', `Bearer ${authToken}`)
							.send({ name: 'Test 1', description: 'UPDATED desc' });

						expect(response.status).toBe(400);
						expect(response.body.error.message).toBe('Invalid project id.');
					});

					it('returns 404 if project not found', async () => {
						const response = await request(app)
							.put(`/api/projects/${NOT_FOUND_ID}`)
							.set('Authorization', `Bearer ${authToken}`)
							.send({ name: 'Test 1', description: 'UPDATED desc' });

						expect(response.status).toBe(404);
						expect(response.body.error.message).toBe('Project not found.');
					});

					it('returns 401 if token is invalid', async () => {
						const response = await request(app)
							.put(`/api/projects/${projectId}`)
							.set('Authorization', `Bearer INVALID_TOKEN`)
							.send({ name: 'Test 1', description: 'UPDATED desc' });

						expect(response.status).toBe(401);
						expect(response.body.error.message).toBe("Authentication token is invalid.");
					});

					it('returns 401 if token is missing', async () => {
						const response = await request(app)
							.put(`/api/projects/${projectId}`)
							.send({ name: 'Test 1', description: 'UPDATED desc' });

						expect(response.status).toBe(401);
						expect(response.body.error.message).toBe("Authentication token is missing.");
					});
				});

				describe('on delete project', () => {
					it('deletes the project', async () => {
						const response = await request(app)
							.delete(`/api/projects/${projectId}`)
							.set('Authorization', `Bearer ${authToken}`);

						expect(response.status).toBe(200);

						const project = await prisma.project.findUnique({ where: { id: projectId } });

						expect(project).toBeNull();
					});

					it('returns 400 for invalid id', async () => {
						const response = await request(app)
							.delete(`/api/projects/${INVALID_ID}`)
							.set('Authorization', `Bearer ${authToken}`);

						expect(response.status).toBe(400);
						expect(response.body.error.message).toBe('Invalid project id.');
					});

					it('returns 404 when project does not exist', async () => {
						const response = await request(app)
							.delete(`/api/projects/${NOT_FOUND_ID}`)
							.set('Authorization', `Bearer ${authToken}`);

						expect(response.status).toBe(404);
						expect(response.body.error.message).toBe('Project not found.');
					});

					it('returns 401 when unauthenticated', async () => {
						const response = await request(app)
							.delete(`/api/projects/${projectId}`);

						expect(response.status).toBe(401);
						expect(response.body.error.message).toBe('Authentication token is missing.');
					});
				});

				describe('on add member to project', () => {
					it('adds member to member list', async () => {
						const response = await request(app)
							.post(`/api/projects/${projectId}/members`)
							.set('Authorization', `Bearer ${authToken}`)
							.send({ userId: martinId })

						expect(response.status).toBe(201);
						expect(response.body.user.id).toBe(martinId);
					});

					it('returns 400 when invalid project id', async () => {
						const response = await request(app)
							.post(`/api/projects/${INVALID_ID}/members`)
							.set('Authorization', `Bearer ${authToken}`)
							.send({ userId: aliceId })

						expect(response.status).toBe(400);
						expect(response.body.error.message).toBe('Invalid project id.');
					});

					it('returns 400 when project not found', async () => {
						const response = await request(app)
							.post(`/api/projects/${NOT_FOUND_ID}/members`)
							.set('Authorization', `Bearer ${authToken}`)
							.send({ userId: aliceId })

						expect(response.status).toBe(404);
						expect(response.body.error.message).toBe('Project not found.');
					});

					it('returns 404 when invalid user to add as member id', async () => {
						const response = await request(app)
							.post(`/api/projects/${projectId}/members`)
							.set('Authorization', `Bearer ${authToken}`)
							.send({ userId: INVALID_ID })

						expect(response.status).toBe(400);
						expect(response.body.error.message).toBe('Invalid user id.');
					});

					it('returns 404 when user to add as member is not found', async () => {
						const response = await request(app)
							.post(`/api/projects/${projectId}/members`)
							.set('Authorization', `Bearer ${authToken}`)
							.send({ userId: NOT_FOUND_ID })

						expect(response.status).toBe(404);
						expect(response.body.error.message).toBe('No user found with the provided id.');
					});

					it('returns 409 when user to add as member is already a member', async () => {
						const response = await request(app)
							.post(`/api/projects/${projectId}/members`)
							.set('Authorization', `Bearer ${authToken}`)
							.send({ userId: aliceId })

						expect(response.status).toBe(409);
						expect(response.body.error.message).toBe('User is already a member of this project.');
					});

					it('returns 401 when not authenticated', async () => {
						const response = await request(app)
							.post(`/api/projects/${projectId}/members`)
							.send({ userId: aliceId })

						expect(response.status).toBe(401);
						expect(response.body.error.message).toBe('Authentication token is missing.');
					});
				});

				describe('on remove project member', () => {
					it('removes member from project', async () => {
						const response = await request(app)
							.delete(`/api/projects/${projectId}/members/${aliceId}`)
							.set('Authorization', `Bearer ${authToken}`);

						expect(response.status).toBe(200);
					});

					it('returns 400 for invalid project id', async () => {
						const response = await request(app)
							.delete(`/api/projects/${INVALID_ID}/members/${aliceId}`)
							.set('Authorization', `Bearer ${authToken}`);

						expect(response.status).toBe(400);
						expect(response.body.error.message).toBe('Invalid project id.');
					});

					it('returns 404 when project does not exist', async () => {
						const response = await request(app)
							.delete(`/api/projects/${NOT_FOUND_ID}/members/${aliceId}`)
							.set('Authorization', `Bearer ${authToken}`);

						expect(response.status).toBe(404);
						expect(response.body.error.message).toBe('Project not found.');
					});

					it('returns 400 for invalid member id', async () => {
						const response = await request(app)
							.delete(`/api/projects/${projectId}/members/${INVALID_ID}`)
							.set('Authorization', `Bearer ${authToken}`);

						expect(response.status).toBe(400);
						expect(response.body.error.message).toBe('Invalid member id.');
					});

					it('returns 400 when user tries to remove himself from project', async () => {
						const response = await request(app)
							.delete(`/api/projects/${projectId}/members/${johnId}`)
							.set('Authorization', `Bearer ${authToken}`);

						expect(response.status).toBe(400);
						expect(response.body.error.message).toBe('You cannot remove yourself from the project.');
					});

					it('returns 401 if unauthorized', async () => {
						const response = await request(app)
							.delete(`/api/projects/${projectId}/members/${aliceId}`);

						expect(response.status).toBe(401);
						expect(response.body.error.message).toBe('Authentication token is missing.');
					});

					it('returns 404 when user is not member of the project', async () => {
						const response = await request(app)
							.delete(`/api/projects/${projectId}/members/${NOT_FOUND_ID}`)
							.set('Authorization', `Bearer ${authToken}`);

						expect(response.status).toBe(404);
						expect(response.body.error.message).toBe('User is not a member of this project.');
					});
				});

				describe('on add board to project', () => {
					it('adds board', async () => {
						const response = await request(app)
							.post(`/api/projects/${projectId}/boards`)
							.set('Authorization', `Bearer ${authToken}`)
							.send({ name: "Board A" });

						expect(response.status).toBe(201);
						expect(response.body.name).toBe("Board A");
					});

					it('returns 400 when invalid project id', async () => {
						const response = await request(app)
							.post(`/api/projects/${INVALID_ID}/boards`)
							.set('Authorization', `Bearer ${authToken}`)
							.send({ name: "Board A" });

						expect(response.status).toBe(400);
						expect(response.body.error.message).toBe("Invalid project id.");
					});

					it('returns 404 when project not found', async () => {
						const response = await request(app)
							.post(`/api/projects/${NOT_FOUND_ID}/boards`)
							.set('Authorization', `Bearer ${authToken}`)
							.send({ name: "Board A" });

						expect(response.status).toBe(404);
						expect(response.body.error.message).toBe("Project not found.");
					});

					it('returns 400 when missing field name in request', async () => {
						const response = await request(app)
							.post(`/api/projects/${projectId}/boards`)
							.set('Authorization', `Bearer ${authToken}`)
							.send({});

						expect(response.status).toBe(400);
						expect(response.body.error.message).toBe("Board name is required.");
					});

					it('returns 400 when field name is invalid', async () => {
						const response = await request(app)
							.post(`/api/projects/${projectId}/boards`)
							.set('Authorization', `Bearer ${authToken}`)
							.send({ name: 5 });

						expect(response.status).toBe(400);
						expect(response.body.error.message).toBe("Board name must be a string.");
					});

					it('returns 400 when name is empty string', async () => {
						const response = await request(app)
							.post(`/api/projects/${projectId}/boards`)
							.set('Authorization', `Bearer ${authToken}`)
							.send({ name: "" });

						expect(response.status).toBe(400);
						expect(response.body.error.message).toBe("Board name is required.");
					});

					it('returns 401 if token is invalid', async () => {
						const response = await request(app)
							.post(`/api/projects/${projectId}/boards`)
							.set('Authorization', `Bearer INVALID_TOKEN`)
							.send({ name: "Updated Board A" });

						expect(response.status).toBe(401);
						expect(response.body.error.message).toBe("Authentication token is invalid.");
					});

					it('returns 401 if token is missing', async () => {
						const response = await request(app)
							.post(`/api/projects/${projectId}/boards`)

						expect(response.status).toBe(401);
						expect(response.body.error.message).toBe("Authentication token is missing.");
					});
				});

				describe('and project has one board', () => {
					beforeEach(async () => {
						const board = await createBoard(authToken, projectId, 'Board A');
					});

					describe('on add board to post', () => {
						it('returns 409 when a board with that name already exists in project', async () => {
							const response = await request(app)
								.post(`/api/projects/${projectId}/boards`)
								.set('Authorization', `Bearer ${authToken}`)
								.send({ name: "Board A" });

							expect(response.status).toBe(409);
							expect(response.body.error.message).toBe('A board with this name already exists in the project.');
						});
					});
				});

				describe('on get project members', () => {
					it('returns the member list', async () => {
						const response = await request(app)
							.get(`/api/projects/${projectId}/members`)
							.set('Authorization', `Bearer ${authToken}`)

						expect(response.status).toBe(200);
						expect(response.body).toHaveLength(2);
					});

					it('returns 400 when invalid project id', async () => {
						const response = await request(app)
							.get(`/api/projects/${INVALID_ID}/members`)
							.set('Authorization', `Bearer ${authToken}`)

						expect(response.status).toBe(400);
						expect(response.body.error.message).toBe('Invalid project id.');
					});

					it('returns 400 when project not found', async () => {
						const response = await request(app)
							.get(`/api/projects/${NOT_FOUND_ID}/members`)
							.set('Authorization', `Bearer ${authToken}`)

						expect(response.status).toBe(404);
						expect(response.body.error.message).toBe('Project not found.');
					});

					it('returns 401 when not authenticated', async () => {
						const response = await request(app)
							.get(`/api/projects/${projectId}/members`)

						expect(response.status).toBe(401);
						expect(response.body.error.message).toBe('Authentication token is missing.');
					});
				});
			});

			describe('and MEMBER is logged in', async () => {
				beforeEach(async () => {
					const member = await loginUser('alice', 'password123');
					authToken = member.token;
				});

				describe('on get project by id', () => {
					it('returns project', async () => {
						const response = await request(app)
							.get(`/api/projects/${projectId}`)
							.set('Authorization', `Bearer ${authToken}`);

						expect(response.status).toBe(200);
						expect(response.body.key).toBe('TEST1');
					});

					it('returns 400 if invalid project id', async () => {
						const response = await request(app)
							.get(`/api/projects/${INVALID_ID}`)
							.set('Authorization', `Bearer ${authToken}`);

						expect(response.status).toBe(400);
						expect(response.body.error.message).toBe('Invalid project id.');
					});

					it('returns 404 if project not found', async () => {
						const response = await request(app)
							.get(`/api/projects/${NOT_FOUND_ID}`)
							.set('Authorization', `Bearer ${authToken}`);

						expect(response.status).toBe(404);
						expect(response.body.error.message).toBe('Project not found.');
					});

					it('returns 401 if token is invalid', async () => {
						const response = await request(app)
							.get(`/api/projects/${projectId}`)
							.set('Authorization', `Bearer INVALID_TOKEN`);

						expect(response.status).toBe(401);
						expect(response.body.error.message).toBe("Authentication token is invalid.");
					});

					it('returns 401 if token is missing', async () => {
						const response = await request(app)
							.get(`/api/projects/${projectId}`);

						expect(response.status).toBe(401);
						expect(response.body.error.message).toBe("Authentication token is missing.");
					});
				});

				describe('on update project', () => {
					it('returns 403 when user is not the admin of the project', async () => {
						const response = await request(app)
							.put(`/api/projects/${projectId}`)
							.set('Authorization', `Bearer ${authToken}`)
							.send({ name: 'Test 1', description: 'UPDATED desc' });

						expect(response.status).toBe(403);
						expect(response.body.error.message).toBe('You must be a project admin to perform this action.');
					});
				});

				describe('on delete project', () => {
					it('returns 403 when user is not an admin', async () => {
						const response = await request(app)
							.delete(`/api/projects/${projectId}`)
							.set('Authorization', `Bearer ${authToken}`);

						expect(response.status).toBe(403);
						expect(response.body.error.message).toBe('You must be a project admin to perform this action.');
					});
				});

				describe('on add board to project', () => {
					it('returns 403 when user is not an admin of the project', async () => {
						const response = await request(app)
							.post(`/api/projects/${projectId}/boards`)
							.set('Authorization', `Bearer ${authToken}`)
							.send({ name: "Board A" });

						expect(response.status).toBe(403);
						expect(response.body.error.message).toBe("You must be a project admin to perform this action.");
					});
				});

				describe('and project has one board', () => {
					beforeEach(async () => {
						const admin = await loginUser('john', 'password123');
						authToken = admin.token;

						const board = await createBoard(authToken, projectId, 'Board A');

						const member = await loginUser('alice', 'password123');
						authToken = member.token;
					});

					describe('on get boards in project', () => {
						it('gets boards', async () => {
							const response = await request(app)
								.get(`/api/projects/${projectId}/boards`)
								.set('Authorization', `Bearer ${authToken}`);

							expect(response.status).toBe(200);
							expect(response.body).toHaveLength(1);
							expect(response.body[0].name).toBe('Board A');
						});

						it('returns 400 if invalid project id', async () => {
							const response = await request(app)
								.get(`/api/projects/${INVALID_ID}/boards`)
								.set('Authorization', `Bearer ${authToken}`);

							expect(response.status).toBe(400);
							expect(response.body.error.message).toBe('Invalid project id.');
						});

						it('returns 404 if project not found', async () => {
							const response = await request(app)
								.get(`/api/projects/${NOT_FOUND_ID}/boards`)
								.set('Authorization', `Bearer ${authToken}`);

							expect(response.status).toBe(404);
							expect(response.body.error.message).toBe('Project not found.');
						});

						it('returns 401 if token is invalid', async () => {
							const response = await request(app)
								.get(`/api/projects/${projectId}/boards`)
								.set('Authorization', `Bearer INVALID_TOKEN`);

							expect(response.status).toBe(401);
							expect(response.body.error.message).toBe("Authentication token is invalid.");
						});

						it('returns 401 if token is missing', async () => {
							const response = await request(app)
								.get(`/api/projects/${projectId}/boards`);

							expect(response.status).toBe(401);
							expect(response.body.error.message).toBe("Authentication token is missing.");
						});
					});
				});
			});

			describe('and non-MEMBER is logged in', async () => {
				beforeEach(async () => {
					const nonMember = await loginUser('martin', 'password123');
					authToken = nonMember.token;
				});

				describe('on get project by id', () => {
					it('returns 403 if user is not a member of the project', async () => {
						const response = await request(app)
							.get(`/api/projects/${projectId}`)
							.set('Authorization', `Bearer ${authToken}`);

						expect(response.status).toBe(403);
						expect(response.body.error.message).toBe('You do not have access to this project.');
					});
				});

				describe('on get boards in project', () => {
					it('returns 403 when user is not a member of the project', async () => {
						const response = await request(app)
							.get(`/api/projects/${projectId}/boards`)
							.set('Authorization', `Bearer ${authToken}`);

						expect(response.status).toBe(403);
						expect(response.body.error.message).toBe('You do not have access to this project.');
					});
				});

				describe('on add board to project', () => {
					it('returns 403 when user is not a member of the project', async () => {
						const response = await request(app)
							.post(`/api/projects/${projectId}/boards`)
							.set('Authorization', `Bearer ${authToken}`)
							.send({ name: "Board A" });

						expect(response.status).toBe(403);
						expect(response.body.error.message).toBe("You do not have access to this project.");
					});
				});
			});
		});

		describe('when multiple projects exist in database', () => {
			let authToken: string;
			let firstProjectId: number;
			let secondProjectId: number;

			beforeEach(async () => {
				//Create project
				const project = await createProject(authToken, 'Test 1', 'TEST1', 'test desc');
				firstProjectId = project.id;

				//Add member to project
				const member = await addMember(authToken, project.id, aliceId);

				//Login as second user
				const secondUser = await loginUser('alice', 'password123');
				authToken = secondUser.token;

				//Create project with second user
				const secondProject = await createProject(authToken, 'Test 2', 'TEST2', 'test desc');
				secondProjectId = secondProject.id;
			});

			describe('on get projects', () => {
				it('returns only the authenticated user projects', async () => {
					const response = await request(app)
						.get('/api/projects')
						.set('Authorization', `Bearer ${authToken}`)

					expect(response.status).toBe(200);
					expect(response.body).toHaveLength(1);
					expect(response.body[0].key).toBe('TEST2');
				});

				it('returns 401 if token is invalid', async () => {
					const response = await request(app)
						.get('/api/projects')
						.set('Authorization', `Bearer INVALID_TOKEN`);

					expect(response.status).toBe(401);
					expect(response.body.error.message).toBe("Authentication token is invalid.");
				});

				it('returns 401 if token is missing', async () => {
					const response = await request(app)
						.get('/api/projects');

					expect(response.status).toBe(401);
					expect(response.body.error.message).toBe("Authentication token is missing.");
				});
			});
		});
	});
});