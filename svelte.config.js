import { sveltekit } from '@sveltejs/kit/vite';
import adapter from '@sveltejs/adapter-vercel';

export default {
	plugins: [sveltekit()],
	kit: {
		adapter: adapter()
	}
};
