import { defineConfig } from 'vitest/config';

export default defineConfig({
	test: {
		setupFiles: ['./src/utils/config.ts'],
		environment: 'node',
		clearMocks: true,
		fileParallelism: false,
        hookTimeout: 30000, //Got error "Error: Hook timed out in 10000ms." in github actions backend test step (in task.test.ts file)
	},
});