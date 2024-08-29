<!-- src/routes/+layout.svelte -->
<script>
	import { auth } from '$lib/firebase';
	import { onAuthStateChanged, getIdToken } from 'firebase/auth';
	import { goto } from '$app/navigation';
	import { browser } from '$app/environment'; // Import browser from SvelteKit

	if (browser) {
		// Only run this code on the client side
		onAuthStateChanged(auth, async (user) => {
			if (user) {
				const token = await getIdToken(user);

				// Send request with the token if necessary
				const response = await fetch('/protected', {
					headers: {
						Authorization: `Bearer ${token}`
					}
				});

				const data = await response.json();
				console.log('Authenticated data:', data);

				// You can also redirect the user to a different route
				if (window.location.pathname === '/login') {
					goto('/'); // Redirect to home page if already logged in
				}
			} else {
				// Redirect to login if not authenticated
				if (window.location.pathname !== '/login') {
					goto('/login');
				}
			}
		});
	}
</script>

<slot />
