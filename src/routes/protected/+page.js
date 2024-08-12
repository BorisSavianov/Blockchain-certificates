import { redirect } from '@sveltejs/kit';

export async function load({ locals }) {
	// Ensure that `locals.user` is defined
	if (!locals || !locals.user) {
		throw redirect(302, '/login');
	}

	return {
		user: locals.user // Pass user data to the page
	};
}
