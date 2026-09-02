import { sendEmail } from './email.js';

function escapeHtml(value: string): string {
	return value
		.replaceAll('&', '&amp;')
		.replaceAll('<', '&lt;')
		.replaceAll('>', '&gt;')
		.replaceAll('"', '&quot;')
		.replaceAll("'", '&#039;');
}

export const notifyProjectMemberAdded = async (
	originUser: { username: string; email: string },
	destinationUser: { username: string; email: string },
	project: { name: string }
) => {
	await sendEmail(
		destinationUser.email,
		`You've been added to ${project.name}`,
		`
			<p>Hi ${destinationUser.username},</p>
			<p>
				<strong>${originUser.username}</strong> (${originUser.email}) added you to the project
				<strong>${project.name}</strong>.
			</p>
		`
	);
};

export const notifyProjectMemberRemoved = async (
	originUser: { username: string; email: string },
	destinationUser: { username: string; email: string },
	project: { name: string }
) => {
	await sendEmail(
		destinationUser.email,
		`You've been removed from ${project.name}`,
		`
			<p>Hi ${destinationUser.username},</p>
			<p>
				<strong>${originUser.username}</strong> (${originUser.email}) removed you from the project
				<strong>${project.name}</strong>.
			</p>
		`
	);
};

export const notifyCommentAdded = async (
	originUser: { username: string },
	destinationUser: { username: string; email: string },
	task: { title: string },
	comment: { content: string }
) => {
	await sendEmail(
		destinationUser.email,
		`New comment on task "${task.title}"`,
		`
			<p>Hi ${destinationUser.username},</p>
			<p>
				<strong>${originUser.username}</strong> added a new comment
				to the task <strong>${task.title}</strong>:
			</p>
			<blockquote>${escapeHtml(comment.content)}</blockquote>
		`
	);
};

export const notifyTaskAssigned = async (
	originUser: { username: string },
	destinationUser: { username: string; email: string },
	task: { title: string }
) => {
	await sendEmail(
		destinationUser.email,
		`You've been assigned to task "${task.title}"`,
		`
			<p>Hi ${destinationUser.username},</p>
			<p>
				<strong>${originUser.username}</strong> assigned you to the task
				<strong>${task.title}</strong>.
			</p>
		`
	);
};

export const notifyTaskUnassigned = async (
	originUser: { username: string },
	destinationUser: { username: string; email: string },
	task: { title: string }
) => {
	await sendEmail(
		destinationUser.email,
		`You've been unassigned from task "${task.title}"`,
		`
			<p>Hi ${destinationUser.username},</p>
			<p>
				<strong>${originUser.username}</strong> unassigned you from the task
				<strong>${task.title}</strong>.
			</p>
		`
	);
};