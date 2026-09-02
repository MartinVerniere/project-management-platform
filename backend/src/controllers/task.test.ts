import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import { app } from '../app.js';
import { clearDatabase, INVALID_ID, NOT_FOUND_ID } from '../helpers/database.js';
import { addMember, assignUser, createBoard, createColumn, createProject, createTask, loginUser, registerUser } from '../helpers/test.js';

const { notifyCommentAddedMock, notifyTaskAssignedMock, notifyTaskUnassignedMock } = vi.hoisted(() => ({
	notifyCommentAddedMock: vi.fn(),
	notifyTaskAssignedMock: vi.fn(),
	notifyTaskUnassignedMock: vi.fn(),
}));

vi.mock('../services/notification.js', () => ({
	notifyCommentAdded: notifyCommentAddedMock,
	notifyTaskAssigned: notifyTaskAssignedMock,
	notifyTaskUnassigned: notifyTaskUnassignedMock,
	notifyProjectMemberAdded: vi.fn(),
	notifyProjectMemberRemoved: vi.fn(),
}));

describe('Task API', () => {
	beforeEach(async () => {
		vi.clearAllMocks();
		await clearDatabase();
	});

	describe('when a task exists in the database', () => {
		let authToken: string;
		let johnId: number;
		let aliceId: number;
		let martinId: number;
		let bobId: number;
		let taskAId: number;
		let taskBId: number;
		let taskCId: number;
		let columnBId: number;
		let columnCId: number;

		beforeEach(async () => {
			//Create users
			const john = await registerUser('john', 'john@test.com', 'password123');
			johnId = john.id;
			const alice = await registerUser('alice', 'alice@test.com', 'password123');
			aliceId = alice.id;
			const martin = await registerUser('martin', 'martin@test.com', 'password123');
			martinId = martin.id;
			const bob = await registerUser('bob', 'bob@test.com', 'password123');
			bobId = bob.id;

			//Login
			const login = await loginUser('john', 'password123');
			authToken = login.token;

			//Create project
			const project = await createProject(authToken, 'Test 1', 'TEST1', 'test desc');

			//Add member to project
			const member = await addMember(authToken, project.id, alice.id);
			const secondMember = await addMember(authToken, project.id, bob.id);

			//Create boards
			const boardA = await createBoard(authToken, project.id, 'Board A');
			const boardB = await createBoard(authToken, project.id, 'Board B');

			//Create column
			const columnA = await createColumn(authToken, boardA.id, 'Column A');
			const columnB = await createColumn(authToken, boardA.id, 'Column B');
			columnBId = columnB.id;
			const columnC = await createColumn(authToken, boardB.id, 'Column C');
			columnCId = columnC.id;

			//Create task
			const taskA = await createTask(authToken, columnA.id, 'Task A', 'This is task A');
			taskAId = taskA.id;
			const taskB = await createTask(authToken, columnA.id, 'Task B', 'This is task B');
			taskBId = taskB.id;
			const secondTaskB = await createTask(authToken, columnB.id, 'Task B', 'This is task B');
			const taskC = await createTask(authToken, columnB.id, 'Task C', 'This is task C');
			taskCId = taskC.id;

			await assignUser(authToken, taskCId, bobId);
		});

		describe('and project ADMIN is logged in', () => {
			beforeEach(async () => {
				const admin = await loginUser('john', 'password123');
				authToken = admin.token;
			});

			describe('on assign user to task', () => {
				it('assigns user to task', async () => {
					const response = await request(app)
						.put(`/api/tasks/${taskAId}/assignee`)
						.set('Authorization', `Bearer ${authToken}`)
						.send({ userId: aliceId });

					expect(response.status).toBe(200);
					expect(response.body.assigneeId).toBe(aliceId);
				});

				it('notifies user that he has been assigned to task', async () => {
					const response = await request(app)
						.put(`/api/tasks/${taskAId}/assignee`)
						.set('Authorization', `Bearer ${authToken}`)
						.send({ userId: aliceId });

					expect(response.status).toBe(200);
					expect(notifyTaskAssignedMock).toHaveBeenCalledWith(
						expect.objectContaining({ id: johnId, username: 'john', }),
						expect.objectContaining({ id: aliceId, username: 'alice', email: 'alice@test.com', }),
						expect.objectContaining({ id: taskAId, title: 'Task A', })
					);
				});

				it('returns 400 if user id is not part of request', async () => {
					const response = await request(app)
						.put(`/api/tasks/${taskAId}/assignee`)
						.set('Authorization', `Bearer ${authToken}`)
						.send({});

					expect(response.status).toBe(400);
					expect(response.body.error.message).toBe("User ID is required.");
				});

				it('returns 400 if invalid user id', async () => {
					const response = await request(app)
						.put(`/api/tasks/${taskAId}/assignee`)
						.set('Authorization', `Bearer ${authToken}`)
						.send({ userId: INVALID_ID });

					expect(response.status).toBe(400);
					expect(response.body.error.message).toBe("Invalid user id.");
				});

				it('returns 404 if user not found', async () => {
					const response = await request(app)
						.put(`/api/tasks/${taskAId}/assignee`)
						.set('Authorization', `Bearer ${authToken}`)
						.send({ userId: NOT_FOUND_ID });

					expect(response.status).toBe(404);
					expect(response.body.error.message).toBe("User to assign task not found.");
				});

				it('returns 409 if user is not member of project that contains the task', async () => {
					const response = await request(app)
						.put(`/api/tasks/${taskAId}/assignee`)
						.set('Authorization', `Bearer ${authToken}`)
						.send({ userId: martinId });

					expect(response.status).toBe(409);
					expect(response.body.error.message).toBe("User can't be assigned to a task of a project he is not a member of.");
				});

				it('returns 400 if invalid task id', async () => {
					const response = await request(app)
						.put(`/api/tasks/${INVALID_ID}/assignee`)
						.set('Authorization', `Bearer ${authToken}`)
						.send({ userId: aliceId });

					expect(response.status).toBe(400);
					expect(response.body.error.message).toBe("Invalid task id.");
				});

				it('returns 404 if task not found', async () => {
					const response = await request(app)
						.put(`/api/tasks/${NOT_FOUND_ID}/assignee`)
						.set('Authorization', `Bearer ${authToken}`)
						.send({ userId: aliceId });

					expect(response.status).toBe(404);
					expect(response.body.error.message).toBe("Task not found.");
				});

				it('returns 401 if token is invalid', async () => {
					const response = await request(app)
						.put(`/api/tasks/${taskAId}/assignee`)
						.set('Authorization', `Bearer INVALID_TOKEN`)
						.send({ userId: aliceId });

					expect(response.status).toBe(401);
					expect(response.body.error.message).toBe("Authentication token is invalid.");
				});

				it('returns 401 if token is missing', async () => {
					const response = await request(app)
						.put(`/api/tasks/${taskAId}/assignee`)
						.send({ userId: aliceId });

					expect(response.status).toBe(401);
					expect(response.body.error.message).toBe("Authentication token is missing.");
				});
			});

			describe('on remove assigned user from task', () => {
				it('removes user assigned to task', async () => {
					const response = await request(app)
						.delete(`/api/tasks/${taskAId}/assignee`)
						.set('Authorization', `Bearer ${authToken}`);

					expect(response.status).toBe(200);
					expect(response.body.assigneeId).toBe(null);
				});

				it('notifies user that he has been unassigned from task', async () => {
					const response = await request(app)
						.delete(`/api/tasks/${taskCId}/assignee`)
						.set('Authorization', `Bearer ${authToken}`);

					expect(response.status).toBe(200);
					expect(notifyTaskUnassignedMock).toHaveBeenCalledWith(
						expect.objectContaining({ id: johnId, username: 'john' }),
						expect.objectContaining({ id: bobId, username: 'bob', email: 'bob@test.com' }),
						expect.objectContaining({ id: taskCId, title: 'Task C' })
					);
				});

				it('returns 400 if invalid task id', async () => {
					const response = await request(app)
						.delete(`/api/tasks/${INVALID_ID}/assignee`)
						.set('Authorization', `Bearer ${authToken}`);

					expect(response.status).toBe(400);
					expect(response.body.error.message).toBe("Invalid task id.");
				});

				it('returns 404 if task not found', async () => {
					const response = await request(app)
						.delete(`/api/tasks/${NOT_FOUND_ID}/assignee`)
						.set('Authorization', `Bearer ${authToken}`);

					expect(response.status).toBe(404);
					expect(response.body.error.message).toBe("Task not found.");
				});

				it('returns 401 if token is invalid', async () => {
					const response = await request(app)
						.delete(`/api/tasks/${taskAId}/assignee`)
						.set('Authorization', `Bearer INVALID_TOKEN`);

					expect(response.status).toBe(401);
					expect(response.body.error.message).toBe("Authentication token is invalid.");
				});

				it('returns 401 if token is missing', async () => {
					const response = await request(app)
						.delete(`/api/tasks/${taskAId}/assignee`);

					expect(response.status).toBe(401);
					expect(response.body.error.message).toBe("Authentication token is missing.");
				});
			});
		});

		describe('and project MEMBER is logged in', () => {
			beforeEach(async () => {
				const member = await loginUser('alice', 'password123');
				authToken = member.token;
			});

			describe('on get task', () => {
				it('gets task by id', async () => {
					const response = await request(app)
						.get(`/api/tasks/${taskAId}`)
						.set('Authorization', `Bearer ${authToken}`);

					expect(response.status).toBe(200);
					expect(response.body.title).toBe('Task A');
				});

				it('returns 400 if invalid task id', async () => {
					const response = await request(app)
						.get(`/api/tasks/${INVALID_ID}`)
						.set('Authorization', `Bearer ${authToken}`);

					expect(response.status).toBe(400);
					expect(response.body.error.message).toBe("Invalid task id.");
				});

				it('returns 404 if task not found', async () => {
					const response = await request(app)
						.get(`/api/tasks/${NOT_FOUND_ID}`)
						.set('Authorization', `Bearer ${authToken}`);

					expect(response.status).toBe(404);
					expect(response.body.error.message).toBe("Task not found.");
				});

				it('returns 401 if token is invalid', async () => {
					const response = await request(app)
						.get(`/api/tasks/${taskAId}`)
						.set('Authorization', `Bearer INVALID_TOKEN`);

					expect(response.status).toBe(401);
					expect(response.body.error.message).toBe("Authentication token is invalid.");
				});

				it('returns 401 if token is missing', async () => {
					const response = await request(app)
						.get(`/api/tasks/${taskAId}`);

					expect(response.status).toBe(401);
					expect(response.body.error.message).toBe("Authentication token is missing.");
				});
			});

			describe('on update task', () => {
				it('updates task', async () => {
					const response = await request(app)
						.put(`/api/tasks/${taskAId}`)
						.set('Authorization', `Bearer ${authToken}`)
						.send({ title: 'Updated task A', description: 'This is task A - UPDATED' });

					expect(response.status).toBe(200);
					expect(response.body.title).toBe('Updated task A');
				});

				it('returns 400 if missing field title in request', async () => {
					const response = await request(app)
						.put(`/api/tasks/${taskAId}`)
						.set('Authorization', `Bearer ${authToken}`)
						.send({ description: 'This is task A - UPDATED' });

					expect(response.status).toBe(400);
					expect(response.body.error.message).toBe("Task title is required.");
				});

				it('returns 400 if task title is not a string', async () => {
					const response = await request(app)
						.put(`/api/tasks/${taskAId}`)
						.set('Authorization', `Bearer ${authToken}`)
						.send({ title: 5, description: 'This is task A - UPDATED' });

					expect(response.status).toBe(400);
					expect(response.body.error.message).toBe("Task title must be a string.");
				});

				it('returns 400 if task title is an empty string', async () => {
					const response = await request(app)
						.put(`/api/tasks/${taskAId}`)
						.set('Authorization', `Bearer ${authToken}`)
						.send({ title: '', description: 'This is task A - UPDATED' });

					expect(response.status).toBe(400);
					expect(response.body.error.message).toBe("Task title is required.");
				});

				it('returns 400 if invalid task id', async () => {
					const response = await request(app)
						.put(`/api/tasks/${INVALID_ID}`)
						.set('Authorization', `Bearer ${authToken}`)
						.send({ title: 'Updated task A', description: 'This is task A - UPDATED' });

					expect(response.status).toBe(400);
					expect(response.body.error.message).toBe("Invalid task id.");
				});

				it('returns 404 if task not found', async () => {
					const response = await request(app)
						.put(`/api/tasks/${NOT_FOUND_ID}`)
						.set('Authorization', `Bearer ${authToken}`)
						.send({ title: 'Updated task A', description: 'This is task A - UPDATED' });

					expect(response.status).toBe(404);
					expect(response.body.error.message).toBe("Task not found.");
				});

				it('returns 401 if token is invalid', async () => {
					const response = await request(app)
						.put(`/api/tasks/${taskAId}`)
						.set('Authorization', `Bearer INVALID_TOKEN`)
						.send({ title: 'Updated task A', description: 'This is task A - UPDATED' });

					expect(response.status).toBe(401);
					expect(response.body.error.message).toBe("Authentication token is invalid.");
				});

				it('returns 401 if token is missing', async () => {
					const response = await request(app)
						.put(`/api/tasks/${taskAId}`)
						.send({ title: 'Updated task A', description: 'This is task A - UPDATED' });

					expect(response.status).toBe(401);
					expect(response.body.error.message).toBe("Authentication token is missing.");
				});
			});

			describe('on add comment to task', () => {
				it('adds comment', async () => {
					const response = await request(app)
						.post(`/api/tasks/${taskAId}/comments`)
						.set('Authorization', `Bearer ${authToken}`)
						.send({ content: 'This is a comment!' });

					expect(response.status).toBe(201);
					expect(response.body.content).toBe('This is a comment!');
				});

				it('notifies user assigned to task that a comment has been added', async () => {
					const response = await request(app)
						.post(`/api/tasks/${taskCId}/comments`)
						.set('Authorization', `Bearer ${authToken}`)
						.send({ content: 'This is a comment!' });

					expect(response.status).toBe(201);
					expect(notifyCommentAddedMock).toHaveBeenCalledWith(
						expect.objectContaining({ id: aliceId, username: 'alice' }),
						expect.objectContaining({ id: bobId, username: 'bob', email: 'bob@test.com' }),
						expect.objectContaining({ id: taskCId, title: 'Task C' }),
						expect.objectContaining({ content: 'This is a comment!' })
					);
				});

				it('returns 400 if missing field content in request', async () => {
					const response = await request(app)
						.post(`/api/tasks/${taskAId}/comments`)
						.set('Authorization', `Bearer ${authToken}`)
						.send({});

					expect(response.status).toBe(400);
					expect(response.body.error.message).toBe("Comment is required.");
				});

				it('returns 400 if comment content is not a string', async () => {
					const response = await request(app)
						.post(`/api/tasks/${taskAId}/comments`)
						.set('Authorization', `Bearer ${authToken}`)
						.send({ content: 5 });

					expect(response.status).toBe(400);
					expect(response.body.error.message).toBe("Comment must be a string.");
				});

				it('returns 400 if comment content is an empty string', async () => {
					const response = await request(app)
						.post(`/api/tasks/${taskAId}/comments`)
						.set('Authorization', `Bearer ${authToken}`)
						.send({ content: '' });

					expect(response.status).toBe(400);
					expect(response.body.error.message).toBe("Comment is required.");
				});

				it('returns 400 if invalid task id', async () => {
					const response = await request(app)
						.post(`/api/tasks/${INVALID_ID}/comments`)
						.set('Authorization', `Bearer ${authToken}`)
						.send({ content: 'This is a comment!' });

					expect(response.status).toBe(400);
					expect(response.body.error.message).toBe("Invalid task id.");
				});

				it('returns 404 if task not found', async () => {
					const response = await request(app)
						.post(`/api/tasks/${NOT_FOUND_ID}/comments`)
						.set('Authorization', `Bearer ${authToken}`)
						.send({ content: 'This is a comment!' });

					expect(response.status).toBe(404);
					expect(response.body.error.message).toBe("Task not found.");
				});

				it('returns 401 if token is invalid', async () => {
					const response = await request(app)
						.post(`/api/tasks/${taskAId}/comments`)
						.set('Authorization', `Bearer INVALID_TOKEN`)
						.send({ content: 'This is a comment!' });

					expect(response.status).toBe(401);
					expect(response.body.error.message).toBe("Authentication token is invalid.");
				});

				it('returns 401 if token is missing', async () => {
					const response = await request(app)
						.post(`/api/tasks/${taskAId}/comments`)
						.send({ content: 'This is a comment!' });

					expect(response.status).toBe(401);
					expect(response.body.error.message).toBe("Authentication token is missing.");
				});
			});

			describe('on move task to another column', () => {
				it('moves task', async () => {
					const response = await request(app)
						.put(`/api/tasks/${taskAId}/column`)
						.set('Authorization', `Bearer ${authToken}`)
						.send({ columnId: columnBId });

					expect(response.status).toBe(200);
					expect(response.body.columnId).toBe(columnBId);
				});

				it('returns 400 if missing field column id in request', async () => {
					const response = await request(app)
						.put(`/api/tasks/${taskAId}/column`)
						.set('Authorization', `Bearer ${authToken}`)
						.send({});

					expect(response.status).toBe(400);
					expect(response.body.error.message).toBe('Column id is required.');
				});

				it('returns 400 if invalid column id', async () => {
					const response = await request(app)
						.put(`/api/tasks/${taskAId}/column`)
						.set('Authorization', `Bearer ${authToken}`)
						.send({ columnId: INVALID_ID });

					expect(response.status).toBe(400);
					expect(response.body.error.message).toBe('Invalid column id.');
				});

				it('returns 404 if destination column not found', async () => {
					const response = await request(app)
						.put(`/api/tasks/${taskAId}/column`)
						.set('Authorization', `Bearer ${authToken}`)
						.send({ columnId: NOT_FOUND_ID });

					expect(response.status).toBe(404);
					expect(response.body.error.message).toBe('Destination column not found.');
				});

				it('returns 409 if destination column belongs to a different board', async () => {
					const response = await request(app)
						.put(`/api/tasks/${taskAId}/column`)
						.set('Authorization', `Bearer ${authToken}`)
						.send({ columnId: columnCId });

					expect(response.status).toBe(409);
					expect(response.body.error.message).toBe("Can't move a task to a column of a different board.");
				});

				it('returns 409 if destination column already has a task with the same title', async () => {
					const response = await request(app)
						.put(`/api/tasks/${taskBId}/column`)
						.set('Authorization', `Bearer ${authToken}`)
						.send({ columnId: columnBId });

					expect(response.status).toBe(409);
					expect(response.body.error.message).toBe("A task with this title already exists in the destination column.");
				});

				it('returns 400 if invalid task', async () => {
					const response = await request(app)
						.put(`/api/tasks/${INVALID_ID}/column`)
						.set('Authorization', `Bearer ${authToken}`)
						.send({ columnId: columnBId });

					expect(response.status).toBe(400);
					expect(response.body.error.message).toBe('Invalid task id.');
				});

				it('returns 404 if task not found', async () => {
					const response = await request(app)
						.put(`/api/tasks/${NOT_FOUND_ID}/column`)
						.set('Authorization', `Bearer ${authToken}`)
						.send({ columnId: columnBId });

					expect(response.status).toBe(404);
					expect(response.body.error.message).toBe('Task not found.');
				});

				it('returns 401 if token is invalid', async () => {
					const response = await request(app)
						.put(`/api/tasks/${taskAId}/column`)
						.set('Authorization', `Bearer INVALID_TOKEN`)
						.send({ columnId: columnBId });

					expect(response.status).toBe(401);
					expect(response.body.error.message).toBe("Authentication token is invalid.");
				});

				it('returns 401 if token is missing', async () => {
					const response = await request(app)
						.put(`/api/tasks/${taskAId}/column`)
						.send({ columnId: columnBId });

					expect(response.status).toBe(401);
					expect(response.body.error.message).toBe("Authentication token is missing.");
				});
			});

			describe('on asign user to task', () => {
				it('returns 403 if user is not an admin of the project that contains the task', async () => {
					const response = await request(app)
						.put(`/api/tasks/${taskAId}/assignee`)
						.set('Authorization', `Bearer ${authToken}`)
						.send({ userId: aliceId });

					expect(response.status).toBe(403);
					expect(response.body.error.message).toBe("You must be a project admin to perform this action.");
				});
			});

			describe('on remove asigned user from task', () => {
				it('returns 403 if user is not an admin of the project that contains the task', async () => {
					const response = await request(app)
						.delete(`/api/tasks/${taskAId}/assignee`)
						.set('Authorization', `Bearer ${authToken}`);

					expect(response.status).toBe(403);
					expect(response.body.error.message).toBe("You must be a project admin to perform this action.");
				});
			});

			describe('on delete task', () => {
				it('deletes task', async () => {
					const response = await request(app)
						.delete(`/api/tasks/${taskAId}`)
						.set('Authorization', `Bearer ${authToken}`);

					expect(response.status).toBe(204);
				});
				it('returns 400 if invalid task id', async () => {
					const response = await request(app)
						.delete(`/api/tasks/${INVALID_ID}`)
						.set('Authorization', `Bearer ${authToken}`);

					expect(response.status).toBe(400);
					expect(response.body.error.message).toBe("Invalid task id.");
				});
				it('returns 404 if task not found', async () => {
					const response = await request(app)
						.delete(`/api/tasks/${NOT_FOUND_ID}`)
						.set('Authorization', `Bearer ${authToken}`);

					expect(response.status).toBe(404);
					expect(response.body.error.message).toBe("Task not found.");
				});
				it('returns 401 if token is invalid', async () => {
					const response = await request(app)
						.delete(`/api/tasks/${taskAId}`)
						.set('Authorization', `Bearer INVALID_TOKEN`);

					expect(response.status).toBe(401);
					expect(response.body.error.message).toBe("Authentication token is invalid.");
				});
				it('returns 401 if token is missing', async () => {
					const response = await request(app)
						.delete(`/api/tasks/${taskAId}`);

					expect(response.status).toBe(401);
					expect(response.body.error.message).toBe("Authentication token is missing.");
				});
			});
		});

		describe('and non-MEMBER is logged in', () => {
			beforeEach(async () => {
				const nonMember = await loginUser('martin', 'password123');

				authToken = nonMember.token;
			});

			describe('on get task', () => {
				it('returns 403 if user is not a member of the project that contains the task', async () => {
					const response = await request(app)
						.get(`/api/tasks/${taskAId}`)
						.set('Authorization', `Bearer ${authToken}`);

					expect(response.status).toBe(403);
					expect(response.body.error.message).toBe("You do not have access to this project.");
				});
			});

			describe('on update task', () => {
				it('returns 403 if user is not a member of the project that contains the task', async () => {
					const response = await request(app)
						.put(`/api/tasks/${taskAId}`)
						.set('Authorization', `Bearer ${authToken}`)
						.send({ title: 'Updated task A', description: 'This is task A - UPDATED' });

					expect(response.status).toBe(403);
					expect(response.body.error.message).toBe("You do not have access to this project.");
				});
			});

			describe('on add comment to task', () => {
				it('returns 403 if user is not a member of the project that contains the task', async () => {
					const response = await request(app)
						.post(`/api/tasks/${taskAId}/comments`)
						.set('Authorization', `Bearer ${authToken}`)
						.send({ content: 'This is an updated comment!' });

					expect(response.status).toBe(403);
					expect(response.body.error.message).toBe("You do not have access to this project.");
				});
			});

			describe('on move task to another column', () => {
				it('returns 403 if user is not a member of the project that contains the task', async () => {
					const response = await request(app)
						.put(`/api/tasks/${taskAId}/column`)
						.set('Authorization', `Bearer ${authToken}`)
						.send({ columnId: columnBId });

					expect(response.status).toBe(403);
					expect(response.body.error.message).toBe("You do not have access to this project.");
				});
			});

			describe('on assign user to task', () => {
				it('returns 403 if user is not a member of the project that contains the task', async () => {
					const response = await request(app)
						.put(`/api/tasks/${taskAId}/assignee`)
						.set('Authorization', `Bearer ${authToken}`)
						.send({ userId: aliceId });

					expect(response.status).toBe(403);
					expect(response.body.error.message).toBe("You do not have access to this project.");
				});
			});

			describe('on remove assigned user from task', () => {
				it('returns 403 if user is not a member of the project that contains the task', async () => {
					const response = await request(app)
						.delete(`/api/tasks/${taskAId}/assignee`)
						.set('Authorization', `Bearer ${authToken}`);

					expect(response.status).toBe(403);
					expect(response.body.error.message).toBe("You do not have access to this project.");
				});
			});

			describe('on delete task', () => {
				it('returns 403 if user is not a member of the project that contains the task', async () => {
					const response = await request(app)
						.delete(`/api/tasks/${taskAId}`)
						.set('Authorization', `Bearer ${authToken}`);

					expect(response.status).toBe(403);
					expect(response.body.error.message).toBe("You do not have access to this project.");
				});
			});
		});
	});

	describe('when multiple tasks exist in the database', () => {
		let authToken: string;
		let taskAId: number;
		let taskBId: number;

		beforeEach(async () => {
			//Create users
			const john = await registerUser('john', 'john@test.com', 'password123');
			const alice = await registerUser('alice', 'alice@test.com', 'password123');
			const martin = await registerUser('martin', 'martin@test.com', 'password123');

			//Login
			const login = await loginUser('john', 'password123');
			authToken = login.token;

			//Create project
			const project = await createProject(authToken, 'Test 1', 'TEST1', 'test desc');


			//Add member to project
			const member = await addMember(authToken, project.id, alice.id);

			//Create board
			const board = await createBoard(authToken, project.id, 'Board A');

			//Create column
			const column = await createColumn(authToken, board.id, 'Column A');

			//Create tasks
			const task = await createTask(authToken, column.id, 'Task A', 'This is task A');
			taskAId = task.id;
			const taskB = await createTask(authToken, column.id, 'Task B', 'This is task B');
			taskBId = taskB.id;
		});

		describe('and project MEMBER is logged in', () => {
			beforeEach(async () => {
				const member = await loginUser('alice', 'password123');
				authToken = member.token;
			});

			describe('on update task', () => {
				it('returns 409 if a task with that same title already exists in that column', async () => {
					const response = await request(app)
						.put(`/api/tasks/${taskAId}`)
						.set('Authorization', `Bearer ${authToken}`)
						.send({ title: 'Task B', description: 'This is task B' });

					expect(response.status).toBe(409);
					expect(response.body.error.message).toBe("A task with this title already exists in the column.");
				});
			});
		});
	});
});