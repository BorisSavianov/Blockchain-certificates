<script>
	import { onMount } from 'svelte';
	import { getAuth, onAuthStateChanged } from 'firebase/auth';

	onMount(() => {
		const auth = getAuth();

		onAuthStateChanged(auth, async (user) => {
			if (user) {
				const idToken = await user.getIdToken();

				// Store the token in a global store or use it directly in your requests
				fetch('/protected', {
					method: 'GET',
					headers: {
						Authorization: `Bearer ${idToken}`
					}
				});
			}
		});
	});
</script>

<slot />
