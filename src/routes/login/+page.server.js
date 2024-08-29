// src/routes/login/+page.server.js
import { redirect } from '@sveltejs/kit';

export async function load({ locals }) {
	// Redirect authenticated users away from the login page
	if (locals.user) {
		throw redirect(302, '/');
	}

	return {};
}
