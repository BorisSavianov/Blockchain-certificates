import { adminAuth } from '$lib/server/firebaseAdmin';
import { redirect } from '@sveltejs/kit';

export async function handle({ event, resolve }) {
	const authHeader = event.request.headers.get('Authorization');
	let user = null;

	if (authHeader && authHeader.startsWith('Bearer ')) {
		const idToken = authHeader.split(' ')[1];

		try {
			const decodedToken = await adminAuth.verifyIdToken(idToken);
			user = decodedToken;
			event.locals.user = user; // Store user info in event.locals
		} catch (error) {
			console.error('Token verification failed:', error);
			// Optionally, handle the case where token verification fails
			// e.g., clear token, log out user, etc.
		}
	}

	const url = new URL(event.request.url);

	// Continue with the request
	return resolve(event);
}
