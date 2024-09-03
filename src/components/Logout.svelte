<script>
	import { auth } from '$lib/firebase';
	import { signOut } from 'firebase/auth';

	function handleSignOut() {
		signOut(auth)
			.then(() => {
				console.log('User signed out');
				// Optionally, redirect or perform other actions
			})
			.catch((error) => {
				console.error('Sign-out error:', error);
			});
	}
</script>

<a class="dropdown-item" on:click={handleSignOut} href="/login">Logout</a>
