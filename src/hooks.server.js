import { redirect } from '@sveltejs/kit';
import { auth } from '$lib/firebase';

/** @type {import('@sveltejs/kit').Handle} */
export async function handle({ event, resolve }) {
	const user = auth.currentUser;

	// If user is not authenticated and tries to access a protected route
	if (!user && event.url.pathname.startsWith('/protected')) {
		throw redirect(302, '/login'); // Redirect to the login page
	}

	// If user is authenticated and tries to access login or signup page
	if (user && event.url.pathname === '/login') {
		throw redirect(302, '/'); // Redirect to the dashboard or homepage
	}

	return await resolve(event);
}
