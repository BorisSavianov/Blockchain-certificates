<!-- src/routes/+layout.svelte -->
<script>
	import { authStore } from '$lib/stores/authStore.js';
	import { onDestroy } from 'svelte';
	import { page } from '$app/stores'; // Import page store to check current route

	let auth = { loading: true, isLoggedIn: false }; // Initial state

	// Subscribe to authStore to get the latest auth state
	const unsubscribe = authStore.subscribe((value) => {
		auth = value; // Update auth state when store changes
	});

	// Clean up the subscription on component destroy
	onDestroy(() => {
		unsubscribe(); // Call unsubscribe to clean up
	});
</script>

{#if auth.loading}
	<p>Loading...</p>
{:else if auth.isLoggedIn}
	<slot /> <!-- Show protected content if logged in -->
{:else if $page.url.pathname === '/login'}
	<slot /> <!-- Allow access to login page if not logged in -->
{:else}
	<a href="/login">Please log in</a>
	<!-- Redirect to login if not logged in and not on login page -->
{/if}
