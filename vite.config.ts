import { paraglideVitePlugin } from '@inlang/paraglide-js';
import { svelteTesting } from '@testing-library/svelte/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import dotenv from 'dotenv';
import tailwindcss from '@tailwindcss/vite'
import devtoolsJson from 'vite-plugin-devtools-json';



export default defineConfig({
	build: {
		target: "esnext",
		sourcemap: true
	},
	optimizeDeps: { esbuildOptions: { target: "esnext" } },
	server: {
		watch: {
			ignored: [
				'**/mockoon.json',
				'**docker-compose.yml',
				'*.db',
				'**/bruno/**',
				'*.md'
			]
		}
	},
	// I had to do this to get process.env to have variables because I can't import svelte env in schema.ts
	define: (() => {
		const result = {};
		const env = dotenv.config().parsed;
		Object.entries(env).forEach(([k, v]) => (result[`process.env.${k}`] = `'${v}'`));
		return result;
	})(),
	plugins: [
		tailwindcss(),
		devtoolsJson(),
		sveltekit(),
		paraglideVitePlugin({
			project: './project.inlang',
			outdir: './src/lib/paraglide',
			strategy: ['cookie', 'preferredLanguage', 'baseLocale']
		})
	],
	test: {
		workspace: [
			{
				extends: './vite.config.ts',
				plugins: [svelteTesting()],
				test: {
					name: 'client',
					environment: 'jsdom',
					clearMocks: true,
					include: ['src/**/*.svelte.{test,spec}.{js,ts}'],
					exclude: ['src/lib/server/**'],
					setupFiles: ['./vitest-setup-client.ts']
				}
			},
			{
				extends: './vite.config.ts',
				test: {
					name: 'server',
					environment: 'node',
					include: ['src/**/*.{test,spec}.{js,ts}'],
					exclude: ['src/**/*.svelte.{test,spec}.{js,ts}']
				}
			}
		]
	}
});
