import { Routes } from "@angular/router";
import { authGuard } from "./auth.guard";
import { Login } from "./auth/login/login";
import { Register } from "./auth/register/register";
import { BoardDetails } from "./boards/board-details/board-details";
import { BoardForm } from "./boards/board-form/board-form";
import { BoardUpdateForm } from "./boards/board-update-form/board-update-form";
import { ColumnForm } from "./columns/column-form/column-form";
import { ColumnUpdateForm } from "./columns/column-update-form/column-update-form";
import { Home } from "./home/home";
import { ProjectDetails } from "./projects/project-details/project-details";
import { ProjectForm } from "./projects/project-form/project-form";
import { ProjectList } from "./projects/project-list/project-list";
import { TaskUpdateForm } from "./tasks/task-update-form/task-update-form";
import { TaskForm } from "./tasks/task-form/task-form";

export const routes: Routes = [
	{
		path: '',
		component: Home,
		canActivate: [authGuard]
	},
	{
		path: 'login',
		component: Login
	},
	{
		path: 'register',
		component: Register
	},
	{
		path: 'projects',
		component: ProjectList
	},
	{
		path: 'projects/create',
		component: ProjectForm
	},
	{
		path: 'projects/:id',
		component: ProjectDetails
	},
	{
		path: 'projects/:id/boards/create',
		component: BoardForm,
	},
	{
		path: 'projects/:projectId/boards/:boardId',
		component: BoardDetails
	},
	{
		path: 'projects/:projectId/boards/:boardId/edit',
		component: BoardUpdateForm
	},
	{
		path: 'projects/:projectId/boards/:boardId/columns/create',
		component: ColumnForm
	},
	{
		path: 'projects/:projectId/boards/:boardId/columns/:columnId/edit',
		component: ColumnUpdateForm
	},
	{
		path: 'projects/:projectId/boards/:boardId/columns/:columnId/tasks/create',
		component: TaskForm
	},
	{
		path: 'projects/:projectId/boards/:boardId/columns/:columnId/tasks/:taskId/edit',
		component: TaskUpdateForm
	}
];
