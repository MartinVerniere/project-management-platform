# Project Management Platform

A full-stack Agile project management application inspired by Jira's issue tracking workflows and Kanban boards. Built with Angular, Node.js, Express, and TypeScript to practice modern full-stack development.

The project includes automated backend, frontend, and end-to-end testing, with CI handled through GitHub Actions.

## Live Demo

- Frontend: https://project-management-platform-black.vercel.app
- Backend: https://project-management-platform-backend-vuo7.onrender.com

## Purpose

The goal of this project was to learn full-stack development with Angular by building a production-style application incrementally, implementing features from backend APIs to frontend interfaces.

## Tech Stack

### Frontend

- Angular
- TypeScript
- Vitest
- Angular CDK

### Backend

- Node.js
- Express
- TypeScript
- PostgreSQL
- Prisma
- Vitest

### Storage & Email

- Supabase Storage
- Nodemailer

### End-to-End Testing

- Playwright

### CI/CD

- GitHub Actions
- Vercel
- Render

## Features

### Project Management

- Projects
- Boards
- Columns
- Tasks
- Drag & Drop

### Collaboration

- Authentication
- Project members
- Add/remove users from projects
- Assign tasks to yourself or other users
- Comments on tasks
- User avatars
- Email notifications for events such as task assignments and project membership changes

## Testing

- Backend unit/integration tests with Vitest
- Angular unit tests with Vitest
- End-to-end tests with Playwright
- Automated testing through GitHub Actions

## Local Development

### Frontend

cd frontend
npm install
ng serve

Frontend runs on:
http://localhost:4200

### Backend

cd backend
npm install
npm run dev

Backend runs on:
http://localhost:3000

Environment variables are required for the backend and should be configured in .env.