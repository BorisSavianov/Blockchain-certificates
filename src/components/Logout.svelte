<!-- src/Logout.svelte -->
<script>
	import { auth } from './firebase';
	import { signOut } from 'firebase/auth';

	// Function to handle logout
	const handleLogout = async () => {
		try {
			await signOut(auth);
			alert('Successfully logged out');
			// Redirect to login page
			window.location.href = '/login';
		} catch (error) {
			console.error('Error logging out:', error);
			alert('Failed to log out. Please try again.');
		}
	};
</script>

<!-- Call the handleLogout function when clicking "Logout" -->
<a class="dropdown-item" href="#" on:click|preventDefault={handleLogout}> Logout </a>
