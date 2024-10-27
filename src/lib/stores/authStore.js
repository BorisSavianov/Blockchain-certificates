// src/lib/stores/authStore.js
import { writable } from 'svelte/store';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '$lib/firebase'; // Import initialized firebaseApp

// Auth store to manage user state
export const authStore = writable({
	user: null,
	isLoggedIn: false,
	loading: true
});

// Track the auth state change
onAuthStateChanged(auth, (user) => {
	authStore.set({
		user: user || null,
		isLoggedIn: !!user,
		loading: false
	});
});
