import express from 'express';
import cors from 'cors';

import authRouter from './controllers/auth.js';
import { ApiError, errorHandler, loggerMiddleware } from './utils/middleware.js';
import projectRouter from './controllers/project.js';
import userRouter from './controllers/user.js';
import boardRouter from './controllers/board.js';
import boardColumnRouter from './controllers/boardColumn.js';
import taskRouter from './controllers/task.js';
import commentRouter from './controllers/comment.js';

export const app = express();

app.use(cors());
app.use(express.json());
app.use(loggerMiddleware);

app.get('/health', (_req, res) => { res.status(200).json({ status: 'ok' }); });

app.use('/api/auth', authRouter);
app.use('/api/users', userRouter);
app.use('/api/projects', projectRouter);
app.use('/api/boards', boardRouter);
app.use('/api/columns', boardColumnRouter)
app.use('/api/tasks', taskRouter);
app.use('/api/comments', commentRouter)
app.use((_request, _response) => { throw new ApiError(404, "ROUTE_NOT_FOUND", "Route not found."); });

app.use(errorHandler);
