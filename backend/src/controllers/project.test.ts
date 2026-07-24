import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';

import { prisma } from '../prisma.js';
import { app } from '../app.js';
import { ProjectRole } from '../generated/prisma/client.js';
import { clearDatabase, NOT_FOUND_ID } from '../helpers/database.js';

describe('Project API', () => {
	beforeEach(async () => {
		await clearDatabase();
	});

	describe('when at least one user exists in database', () => {
		let johnUserId: number;
		let aliceUserId: number;

		beforeEach(async () => {
			let response = await request(app)
				.post('/api/auth/register')
				.send({
					username: 'john',
					email: 'john@test.com',
					password: 'password123',
				});

			johnUserId = response.body.id;

			response = await request(app)
				.post('/api/auth/register')
				.send({
					username: 'alice',
					email: 'alice@test.com',
					password: 'password123',
				});

			aliceUserId = response.body.id;
		});

		describe('and a user is logged in', () => {
			let authToken: string;

			beforeEach(async () => {
				const response = await request(app)
					.post('/api/auth/login')
					.send({
						username: 'john',
						password: 'password123',
					});

				authToken = response.body.token;
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

				it('creates the creator as an ADMIN member', async () => {
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

				it('returns 401 when unauthenticated', async () => {
					const response = await request(app)
						.post(`/api/projects`)
						.send({
							name: 'Test 1',
							key: 'TEST1',
							description: 'test desc'
						});

					expect(response.status).toBe(401);
					expect(response.body.error.message).toBe('Authentication token is missing.');
				});
			});

			describe('and the user has already created projects', () => {
				let firstProjectId: number;
				let secondProjectId: number;

				beforeEach(async () => {
					const responseA = await request(app)
						.post('/api/projects')
						.set('Authorization', `Bearer ${authToken}`)
						.send({
							name: 'Test 1',
							key: 'TEST1',
							description: 'test desc'
						});

					firstProjectId = responseA.body.id;

					const responseB = await request(app)
						.post('/api/projects')
						.set('Authorization', `Bearer ${authToken}`)
						.send({
							name: 'Test2',
							key: 'TEST2',
							description: 'test desc'
						});

					secondProjectId = responseB.body.id;
				});

				describe('on get projects', () => {
					it('returns the authenticated user projects', async () => {
						const response = await request(app)
							.get('/api/projects')
							.set('Authorization', `Bearer ${authToken}`)

						expect(response.status).toBe(200);
						expect(response.body).toHaveLength(2);
					});

					it('returns 401 when no token is provided', async () => {
						const response = await request(app)
							.get('/api/projects');

						expect(response.status).toBe(401);
						expect(response.body.error.message).toBe('Authentication token is missing.');
					});
				});

				describe('on get project by id', () => {
					it('returns the requested project', async () => {
						const response = await request(app)
							.get(`/api/projects/${secondProjectId}`)
							.set('Authorization', `Bearer ${authToken}`);

						expect(response.status).toBe(200);
						expect(response.body.key).toBe('TEST2');
					});

					it('returns 400 for an invalid id', async () => {
						const response = await request(app)
							.get(`/api/projects/abc`)
							.set('Authorization', `Bearer ${authToken}`);

						expect(response.status).toBe(400);
						expect(response.body.error.message).toBe('Invalid project id.');
					});

					it('returns 404 when the project does not exist', async () => {
						const response = await request(app)
							.get(`/api/projects/${NOT_FOUND_ID}`)
							.set('Authorization', `Bearer ${authToken}`);

						expect(response.status).toBe(404);
						expect(response.body.error.message).toBe('Project not found.');
					});

					it('returns 403 when the user is not a member', async () => {
						let response = await request(app)
							.post('/api/auth/login')
							.send({
								username: 'alice',
								password: 'password123',
							});

						authToken = response.body.token;

						response = await request(app)
							.get(`/api/projects/${firstProjectId}`)
							.set('Authorization', `Bearer ${authToken}`);

						expect(response.status).toBe(403);
						expect(response.body.error.message).toBe('You do not have access to this project.');
					});
				});

				describe('on create project', () => {
					it('returns 409 when new project key already exists in database', async () => {
						const response = await request(app)
							.post(`/api/projects`)
							.set('Authorization', `Bearer ${authToken}`)
							.send({
								name: 'Test 1',
								key: 'TEST1',
								description: 'test desc'
							});

						expect(response.status).toBe(409);
						expect(response.body.error.message).toBe('A project with this key already exists.');
					});
				});

				describe('on add member to project', () => {
					it('add member to member list', async () => {
						const response = await request(app)
							.post(`/api/projects/${firstProjectId}/members`)
							.set('Authorization', `Bearer ${authToken}`)
							.send({ userId: aliceUserId })

						expect(response.status).toBe(201);
						expect(response.body.userId).toBe(aliceUserId);
					});

					it('returns 400 when invalid project id', async () => {
						const response = await request(app)
							.post(`/api/projects/abc/members`)
							.set('Authorization', `Bearer ${authToken}`)
							.send({ userId: aliceUserId })

						expect(response.status).toBe(400);
						expect(response.body.error.message).toBe('Invalid project id.');
					});

					it('returns 400 when project not found', async () => {
						const response = await request(app)
							.post(`/api/projects/${NOT_FOUND_ID}/members`)
							.set('Authorization', `Bearer ${authToken}`)
							.send({ userId: aliceUserId })

						expect(response.status).toBe(404);
						expect(response.body.error.message).toBe('Project not found.');
					});

					it('returns 404 when invalid user to add as member id', async () => {
						const response = await request(app)
							.post(`/api/projects/${firstProjectId}/members`)
							.set('Authorization', `Bearer ${authToken}`)
							.send({ userId: 'abc' })

						expect(response.status).toBe(400);
						expect(response.body.error.message).toBe('Invalid user id.');
					});

					it('returns 404 when user to add as member is not found', async () => {
						const response = await request(app)
							.post(`/api/projects/${firstProjectId}/members`)
							.set('Authorization', `Bearer ${authToken}`)
							.send({ userId: NOT_FOUND_ID })

						expect(response.status).toBe(404);
						expect(response.body.error.message).toBe('No user found with the provided id.');
					});

					it('returns 409 when user to add as member is already a member', async () => {
						const response = await request(app)
							.post(`/api/projects/${firstProjectId}/members`)
							.set('Authorization', `Bearer ${authToken}`)
							.send({ userId: johnUserId })

						expect(response.status).toBe(409);
						expect(response.body.error.message).toBe('User is already a member of this project.');
					});

					it('returns 401 when not authenticated', async () => {
						const response = await request(app)
							.post(`/api/projects/${firstProjectId}/members`)
							.send({ userId: aliceUserId })

						expect(response.status).toBe(401);
						expect(response.body.error.message).toBe('Authentication token is missing.');
					});
				});

				describe('on update project', () => {
					it('updates the project', async () => {
						const response = await request(app)
							.put(`/api/projects/${firstProjectId}`)
							.set('Authorization', `Bearer ${authToken}`)
							.send({
								name: 'Test 1',
								description: 'UPDATED desc'
							});

						expect(response.status).toBe(200);
						expect(response.body.description).toBe('UPDATED desc');

						const updated = await prisma.project.findUnique({
							where: {
								id: firstProjectId
							}
						});

						expect(updated?.description).toBe("UPDATED desc");
					});

					it('returns 400 for invalid id', async () => {
						const response = await request(app)
							.put(`/api/projects/abc`)
							.set('Authorization', `Bearer ${authToken}`)
							.send({
								name: 'Test 1',
								description: 'UPDATED desc'
							});

						expect(response.status).toBe(400);
						expect(response.body.error.message).toBe('Invalid project id.');
					});

					it('returns 404 when project does not exist', async () => {
						const response = await request(app)
							.put(`/api/projects/${NOT_FOUND_ID}`)
							.set('Authorization', `Bearer ${authToken}`)
							.send({
								name: 'Test 1',
								description: 'UPDATED desc'
							});

						expect(response.status).toBe(404);
						expect(response.body.error.message).toBe('Project not found.');
					});

					it('returns 401 when unauthenticated', async () => {
						const response = await request(app)
							.put(`/api/projects/${firstProjectId}`)
							.set('Authorization', `Bearer UNAUTHENTICATED`)
							.send({
								name: 'Test 1',
								description: 'UPDATED desc'
							});

						expect(response.status).toBe(401);
						expect(response.body.error.message).toBe('Authentication token is invalid.');
					});
				});

				describe('on delete project', () => {
					it('deletes the project', async () => {
						const response = await request(app)
							.delete(`/api/projects/${firstProjectId}`)
							.set('Authorization', `Bearer ${authToken}`);

						expect(response.status).toBe(200);

						const project = await prisma.project.findUnique({
							where: {
								id: firstProjectId
							}
						});

						expect(project).toBeNull();
					});

					it('returns 400 for invalid id', async () => {
						const response = await request(app)
							.delete(`/api/projects/abc`)
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
							.delete(`/api/projects/${firstProjectId}`);

						expect(response.status).toBe(401);
						expect(response.body.error.message).toBe('Authentication token is missing.');
					});
				});

				describe('on add board to project', () => {
					it('adds board', async () => {
						const response = await request(app)
							.post(`/api/projects/${firstProjectId}/boards`)
							.set('Authorization', `Bearer ${authToken}`)
							.send({ name: "Board A" });

						expect(response.status).toBe(201);
						expect(response.body.name).toBe("Board A");
					});

					it('returns 400 when invalid project id', async () => {
						const response = await request(app)
							.post(`/api/projects/abc/boards`)
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
							.post(`/api/projects/${firstProjectId}/boards`)
							.set('Authorization', `Bearer ${authToken}`)
							.send({});

						expect(response.status).toBe(400);
						expect(response.body.error.message).toBe("Board name is required.");
					});

					it('returns 400 when field name is invalid', async () => {
						const response = await request(app)
							.post(`/api/projects/${firstProjectId}/boards`)
							.set('Authorization', `Bearer ${authToken}`)
							.send({ name: 5 });

						expect(response.status).toBe(400);
						expect(response.body.error.message).toBe("Board name must be a string.");
					});

					it('returns 400 when name is empty string', async () => {
						const response = await request(app)
							.post(`/api/projects/${firstProjectId}/boards`)
							.set('Authorization', `Bearer ${authToken}`)
							.send({ name: "" });

						expect(response.status).toBe(400);
						expect(response.body.error.message).toBe("Board name is required.");
					});

					it('returns 401 if token is invalid', async () => {
						const response = await request(app)
							.post(`/api/projects/${firstProjectId}/boards`)
							.set('Authorization', `Bearer INVALID_TOKEN`)
							.send({ name: "Updated Board A" });

						expect(response.status).toBe(401);
						expect(response.body.error.message).toBe("Authentication token is invalid.");
					});

					it('returns 401 if token is missing', async () => {
						const response = await request(app)
							.post(`/api/projects/${firstProjectId}/boards`)

						expect(response.status).toBe(401);
						expect(response.body.error.message).toBe("Authentication token is missing.");
					});
				});

				describe('if project has at least 2 members', () => {
					beforeEach(async () => {
						await request(app)
							.post(`/api/projects/${firstProjectId}/members`)
							.set('Authorization', `Bearer ${authToken}`)
							.send({
								userId: aliceUserId
							});
					});

					describe('on get project members', () => {
						it('returns the member list', async () => {
							const response = await request(app)
								.get(`/api/projects/${firstProjectId}/members`)
								.set('Authorization', `Bearer ${authToken}`)

							expect(response.status).toBe(200);
							expect(response.body).toHaveLength(2);
						});

						it('returns 400 when invalid project id', async () => {
							const response = await request(app)
								.get(`/api/projects/abc/members`)
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
								.get(`/api/projects/${firstProjectId}/members`)

							expect(response.status).toBe(401);
							expect(response.body.error.message).toBe('Authentication token is missing.');
						});
					});

					describe('on update project', () => {
						it('returns 403 when user is not the admin of the project', async () => {
							await request(app)
								.post(`/api/projects/${firstProjectId}/members`)
								.set('Authorization', `Bearer ${authToken}`)
								.send({
									userId: aliceUserId
								});

							let response = await request(app)
								.post('/api/auth/login')
								.send({
									username: 'alice',
									password: 'password123',
								});

							authToken = response.body.token;

							response = await request(app)
								.put(`/api/projects/${firstProjectId}`)
								.set('Authorization', `Bearer ${authToken}`)
								.send({
									name: 'Test 1',
									description: 'UPDATED desc'
								});

							expect(response.status).toBe(403);
							expect(response.body.error.message).toBe('You must be a project admin to perform this action.');
						});
					});

					describe('on delete project', () => {
						it('returns 403 when user is not an admin', async () => {
							await request(app)
								.post(`/api/projects/${firstProjectId}/members`)
								.set('Authorization', `Bearer ${authToken}`)
								.send({
									userId: aliceUserId
								});

							let response = await request(app)
								.post('/api/auth/login')
								.send({
									username: 'alice',
									password: 'password123',
								});

							authToken = response.body.token;

							response = await request(app)
								.delete(`/api/projects/${firstProjectId}`)
								.set('Authorization', `Bearer ${authToken}`);

							expect(response.status).toBe(403);
							expect(response.body.error.message).toBe('You must be a project admin to perform this action.');
						});
					});
				});

				describe('if project owner is only member', () => {
					describe('on get project members', () => {
						it('returns the admin as only member', async () => {
							const response = await request(app)
								.get(`/api/projects/${firstProjectId}/members`)
								.set('Authorization', `Bearer ${authToken}`)

							expect(response.status).toBe(200);
							expect(response.body).toHaveLength(1);
						});
					});
				});

				describe('on remove project member', () => {
					it('returns 404 when user is not member of the project', async () => {
						const response = await request(app)
							.delete(`/api/projects/${firstProjectId}/members/${aliceUserId}`)
							.set('Authorization', `Bearer ${authToken}`);

						expect(response.status).toBe(404);
						expect(response.body.error.message).toBe('User is not a member of this project.');
					});
				});

				describe('and one of the projects created has more than one member', () => {
					beforeEach(async () => {
						await request(app)
							.post(`/api/projects/${firstProjectId}/members`)
							.set('Authorization', `Bearer ${authToken}`)
							.send({ userId: aliceUserId });
					});

					describe('on remove project member', () => {
						it('removes member from project', async () => {
							const response = await request(app)
								.delete(`/api/projects/${firstProjectId}/members/${aliceUserId}`)
								.set('Authorization', `Bearer ${authToken}`);

							expect(response.status).toBe(200);
						});

						it('returns 400 for invalid project id', async () => {
							const response = await request(app)
								.delete(`/api/projects/abc/members/${aliceUserId}`)
								.set('Authorization', `Bearer ${authToken}`);

							expect(response.status).toBe(400);
							expect(response.body.error.message).toBe('Invalid project id.');
						});

						it('returns 404 when project does not exist', async () => {
							const response = await request(app)
								.delete(`/api/projects/${NOT_FOUND_ID}/members/${aliceUserId}`)
								.set('Authorization', `Bearer ${authToken}`);

							expect(response.status).toBe(404);
							expect(response.body.error.message).toBe('Project not found.');
						});

						it('returns 400 for invalid member id', async () => {
							const response = await request(app)
								.delete(`/api/projects/${firstProjectId}/members/abc`)
								.set('Authorization', `Bearer ${authToken}`);

							expect(response.status).toBe(400);
							expect(response.body.error.message).toBe('Invalid member id.');
						});

						it('returns 400 when user tries to remove himself from project', async () => {
							const response = await request(app)
								.delete(`/api/projects/${firstProjectId}/members/${johnUserId}`)
								.set('Authorization', `Bearer ${authToken}`);

							expect(response.status).toBe(400);
							expect(response.body.error.message).toBe('You cannot remove yourself from the project.');
						});

						it('returns 401 if unauthorized', async () => {
							const response = await request(app)
								.delete(`/api/projects/${firstProjectId}/members/${aliceUserId}`);

							expect(response.status).toBe(401);
							expect(response.body.error.message).toBe('Authentication token is missing.');
						});
					});
				});

				describe('and non-MEMBER is logged in', () => {
					beforeEach(async () => {
						const response = await request(app)
							.post('/api/auth/login')
							.send({
								username: 'alice',
								password: 'password123',
							});

						authToken = response.body.token;
					});

					describe('on get boards in project', () => {
						it('returns 403 when user is not a member of the project', async () => {
							const response = await request(app)
								.get(`/api/projects/${firstProjectId}/boards`)
								.set('Authorization', `Bearer ${authToken}`);

							expect(response.status).toBe(403);
							expect(response.body.error.message).toBe('You do not have access to this project.');
						});
					});

					describe('on add board to project', () => {
						it('returns 403 when user is not a member of the project', async () => {
							const response = await request(app)
								.post(`/api/projects/${firstProjectId}/boards`)
								.set('Authorization', `Bearer ${authToken}`)
								.send({ name: "Board A" });

							expect(response.status).toBe(403);
							expect(response.body.error.message).toBe("You do not have access to this project.");
						});
					});
				});

				describe('and project has at least one non-ADMIN member', () => {
					beforeEach(async () => {
						await request(app)
							.post(`/api/projects/${firstProjectId}/members`)
							.set('Authorization', `Bearer ${authToken}`)
							.send({ userId: aliceUserId });
					});

					describe('and non-ADMIN member is logged in', () => {
						beforeEach(async () => {
							const response = await request(app)
								.post('/api/auth/login')
								.send({
									username: 'alice',
									password: 'password123',
								});

							authToken = response.body.token;
						});

						describe('on add board to project', () => {
							it('returns 403 when user is not an admin of the project', async () => {
								const response = await request(app)
									.post(`/api/projects/${firstProjectId}/boards`)
									.set('Authorization', `Bearer ${authToken}`)
									.send({ name: "Board A" });

								expect(response.status).toBe(403);
								expect(response.body.error.message).toBe("You must be a project admin to perform this action.");
							});
						});
					});
				});

				describe('and one of the projects created has at least one board', () => {
					let boardId: number;

					beforeEach(async () => {
						const response = await request(app)
							.post(`/api/projects/${firstProjectId}/boards`)
							.set('Authorization', `Bearer ${authToken}`)
							.send({ name: 'Board A' });

						boardId = response.body.id;
					});

					describe('on add board to post', () => {
						it('returns 409 when a board with that name already exists in project', async () => {
							const response = await request(app)
								.post(`/api/projects/${firstProjectId}/boards`)
								.set('Authorization', `Bearer ${authToken}`)
								.send({ name: "Board A" });

							expect(response.status).toBe(409);
							expect(response.body.error.message).toBe('A board with this name already exists in the project.');
						});
					});

					describe('on get boards in project', () => {
						it('gets boards', async () => {
							const response = await request(app)
								.get(`/api/projects/${firstProjectId}/boards`)
								.set('Authorization', `Bearer ${authToken}`);

							expect(response.status).toBe(200);
							expect(response.body).toHaveLength(1);
						});

						it('returns 400 when invalid project id', async () => {
							const response = await request(app)
								.get(`/api/projects/abc/boards`)
								.set('Authorization', `Bearer ${authToken}`);

							expect(response.status).toBe(400);
							expect(response.body.error.message).toBe('Invalid project id.');
						});

						it('returns 404 when project not found', async () => {
							const response = await request(app)
								.get(`/api/projects/${NOT_FOUND_ID}/boards`)
								.set('Authorization', `Bearer ${authToken}`);

							expect(response.status).toBe(404);
							expect(response.body.error.message).toBe('Project not found.');
						});

						it('returns 401 if token is invalid', async () => {
							const response = await request(app)
								.get(`/api/projects/${firstProjectId}/boards`)
								.set('Authorization', `Bearer INVALID_TOKEN`);

							expect(response.status).toBe(401);
							expect(response.body.error.message).toBe("Authentication token is invalid.");
						});

						it('returns 401 if token is missing', async () => {
							const response = await request(app)
								.get(`/api/projects/${firstProjectId}/boards`);

							expect(response.status).toBe(401);
							expect(response.body.error.message).toBe("Authentication token is missing.");
						});
					});
				});
			});

			describe('and the user has not created projects', () => {
				describe('on get projects', () => {
					it('returns an empty array when the user has no projects', async () => {
						const response = await request(app)
							.get('/api/projects')
							.set('Authorization', `Bearer ${authToken}`)

						expect(response.status).toBe(200);
						expect(response.body).toHaveLength(0);
					});
				});
			});

			describe('and another user has created projects', () => {
				beforeEach(async () => {
					let response = await request(app)
						.post('/api/auth/login')
						.send({
							username: 'alice',
							password: 'password123',
						});

					authToken = response.body.token;

					await request(app)
						.post('/api/projects')
						.set('Authorization', `Bearer ${authToken}`)
						.send({
							name: 'Test 1',
							key: 'TEST1',
							description: 'test desc'
						});

					response = await request(app)
						.post('/api/auth/login')
						.send({
							username: 'john',
							password: 'password123',
						});

					authToken = response.body.token;

					await request(app)
						.post('/api/projects')
						.set('Authorization', `Bearer ${authToken}`)
						.send({
							name: 'Test2',
							key: 'TEST2',
							description: 'test desc'
						});
				});

				describe('on get projects', () => {
					it('returns only his projects', async () => {
						const response = await request(app)
							.get('/api/projects')
							.set('Authorization', `Bearer ${authToken}`)

						expect(response.status).toBe(200);
						expect(response.body).toHaveLength(1);
					});
				});
			});
		});
	});
});