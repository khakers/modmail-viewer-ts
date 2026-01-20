import adapter from '@sveltejs/adapter-node';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import * as child_process from 'node:child_process';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: vitePreprocess(),
	kit: {
		prerender: {
			entries:[],
		},
		adapter: adapter(),
		// csp: {
		// 	directives: {
		// 		'script-src': ['self'],
		// 		'media-src': ['self', "cdn.discordapp.com", "media.discordapp.com"],
		// 	},
		// },
		version: {
			name: child_process.execSync('git rev-parse HEAD').toString().trim()
		},
		experimental: {
			remoteFunctions: true
		}
	},
	compilerOptions: {
		experimental: {
			async: true
		}
	}
};

export default config;
