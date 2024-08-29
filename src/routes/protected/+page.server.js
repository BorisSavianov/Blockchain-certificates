// src/routes/protected/+page.server.js
import { redirect } from '@sveltejs/kit';

/** @type {import('./$types').PageServerLoad} */
export async function load({ locals }) {
	// Check if the user is authenticated
	if (!locals.user) {
		// Redirect to the login page if not authenticated
		throw redirect(303, '/login');
	}

	// Return some data if needed
	return {
		message: 'This is a protected page.'
	};
}
