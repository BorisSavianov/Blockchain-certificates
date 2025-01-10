<script>
	import { auth } from '$lib/firebase';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';

	let user = null;
	let message = '';

	onMount(() => {
		user = auth.currentUser;
		if (user && user.emailVerified) {
			goto('/');
		}
	});

	async function resendVerificationEmail() {
		try {
			if (user) {
				await user.reload();
				if (!user.emailVerified) {
					await user.sendEmailVerification();
					message = 'Verification email resent. Please check your inbox.';
				} else {
					message = 'Your email is already verified. Redirecting to the home page.';
					goto('/');
				}
			}
		} catch (error) {
			console.error('Error resending verification email:', error);
			message = 'Error resending verification email. Please try again later.';
		}
	}

	async function deleteAccount() {
		try {
			if (user) {
				await user.delete();
				alert('Your account has been deleted.');
				goto('/'); // Redirect to the homepage or login page
			}
		} catch (error) {
			console.error('Error deleting account:', error);
			message = 'Error deleting account. Please try again later.';
		}
	}
</script>

<main>
	<h1>Email Verification Required</h1>
	<p>
		Please verify your email address to continue using the platform. Check your inbox for a
		verification email.
	</p>

	{#if message}
		<p>{message}</p>
	{/if}

	<button on:click={resendVerificationEmail}>Resend Verification Email</button>
	<button on:click={deleteAccount} style="margin-top: 10px; background-color: red;"
		>Delete Account</button
	>
</main>

<style>
	main {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		height: 100vh;
		text-align: center;
	}

	button {
		margin-top: 20px;
		padding: 10px 20px;
		color: white;
		border: none;
		border-radius: 5px;
		cursor: pointer;
	}

	button:first-child {
		background-color: #007bff;
	}

	button:first-child:hover {
		background-color: #0056b3;
	}

	button:last-child {
		background-color: red;
	}

	button:last-child:hover {
		background-color: darkred;
	}
</style>
