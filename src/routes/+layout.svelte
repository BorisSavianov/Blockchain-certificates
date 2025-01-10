<!-- src/routes/+layout.svelte -->
<script>
	import { authStore } from '$lib/stores/authStore.js';
	import { onDestroy } from 'svelte';
	import { page } from '$app/stores'; // Import page store to check current route

	let authSub = { loading: true, isLoggedIn: false }; // Initial state

	// Subscribe to authStore to get the latest auth state
	const unsubscribe = authStore.subscribe((value) => {
		authSub = value; // Update auth state when store changes
	});

	// Clean up the subscription on component destroy
	onDestroy(() => {
		unsubscribe(); // Call unsubscribe to clean up
	});

	import { onMount } from 'svelte';
	import { auth } from '$lib/firebase';
	import { goto } from '$app/navigation';

	let user;

	onMount(async () => {
		auth.onAuthStateChanged(async (currentUser) => {
			if (currentUser) {
				await currentUser.reload(); // Refresh user to get the latest status
				if (!currentUser.emailVerified && $page.url.pathname !== '/verify-email') {
					goto('/verify-email');
				}
			} else {
				// Redirect to login or home if not authenticated
				goto('/login');
			}
		});
	});
</script>

{#if authSub.loading}
	<p>Loading...</p>
{:else if authSub.isLoggedIn}
	<slot /> <!-- Show protected content if logged in -->
{:else if $page.url.pathname === '/login'}
	<slot /> <!-- Allow access to login page if not logged in -->
{:else}
	<a href="/login">Please log in</a>
	<!-- Redirect to login if not logged in and not on login page -->
{/if}
