<!-- src/routes/+page.svelte -->
<script>
	import { authStore } from '$lib/stores/authStore.js';
	import { onDestroy } from 'svelte';
	import { goto } from '$app/navigation';

	let auth;

	// Subscribe to authStore to track authentication state
	const unsubscribe = authStore.subscribe((value) => {
		auth = value;

		// Redirect to login if loading is done and user is not logged in
		if (!auth.loading && !auth.isLoggedIn) {
			goto('/login');
		}
	});

	// Cleanup the subscription on component destroy
	onDestroy(unsubscribe);
</script>

{#if auth.loading}
	<p>Loading...</p>
{:else if auth.isLoggedIn}
	<div>
		<p>Hello, {auth.user.displayName || 'User'}!</p>
	</div>
{:else}
	<p>You are not logged in.</p>
{/if}
