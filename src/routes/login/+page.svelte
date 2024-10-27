<script>
	import {
		auth,
		googleProvider,
		signInWithPopup,
		signInWithEmailAndPassword,
		createUserWithEmailAndPassword,
		updateProfile,
		onAuthStateChanged,
		db,
		doc,
		setDoc,
		getDoc
	} from '$lib/firebase';

	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';

	let email = '';
	let password = '';
	let userRole = '';
	let displayName = '';
	let isRightPanelActive = false;

	// Handle Firebase Authentication State on mount
	onMount(() => {
		const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
			if (firebaseUser) {
				const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
				if (userDoc.exists()) {
					goto('/');
				} else {
					// Prompt for role selection in a safer way, consider using a modal instead
					userRole = prompt('Select your role (student/organization):');
					if (userRole) {
						await setDoc(doc(db, 'users', firebaseUser.uid), {
							displayName: firebaseUser.displayName || 'Anonymous',
							role: userRole
						});
						goto('/');
					} else {
						await auth.signOut();
						goto('/login');
					}
				}
			}
		});

		// Cleanup on component unmount
		return () => unsubscribeAuth();
	});

	// Register user with email and password
	async function register() {
		try {
			const userCredential = await createUserWithEmailAndPassword(auth, email, password);
			const newUser = userCredential.user;

			await updateProfile(newUser, { displayName });
			await setDoc(doc(db, 'users', newUser.uid), { displayName, role: userRole });

			console.log('User registered:', newUser);
			alert(`Registered as ${userRole}`);
			goto('/');
		} catch (error) {
			console.error('Error registering:', error);
			alert(error.message);
		}
	}

	// Sign in with email and password
	async function signIn() {
		try {
			const userCredential = await signInWithEmailAndPassword(auth, email, password);
			const signedInUser = userCredential.user;
			console.log('User signed in:', signedInUser);
			goto('/');
		} catch (error) {
			console.error('Error signing in:', error);
			alert(error.message);
		}
	}

	// Sign in with Google
	async function signInWithGoogle() {
		try {
			const userCredential = await signInWithPopup(auth, googleProvider);
			const googleUser = userCredential.user;

			const userDoc = await getDoc(doc(db, 'users', googleUser.uid));
			if (!userDoc.exists()) {
				userRole = prompt('Select your role (student/organization):');
				if (userRole) {
					await setDoc(doc(db, 'users', googleUser.uid), {
						displayName: googleUser.displayName || 'Anonymous',
						role: userRole
					});
					console.log('User signed in with Google and role set:', userRole);
				} else {
					await auth.signOut();
					alert('Role is required. Please try signing in again.');
					return;
				}
			} else {
				console.log('User signed in with Google:', googleUser);
			}

			goto('/');
		} catch (error) {
			console.error('Error signing in with Google:', error);
			alert(error.message);
		}
	}
</script>

<html lang="en">
	<head><link rel="stylesheet" href="css/login.css" /></head>
	<body>
		<div class="container" class:isRightPanelActive id="container">
			<!-- Sign Up Form -->
			<div class="form-container sign-up-container">
				<form action="#">
					<h1>Create Account</h1>
					<div class="social-container">
						<a class="social" on:click|preventDefault={signInWithGoogle}>
							<i class="fab fa-google-plus-g"></i>
						</a>
					</div>
					<span>or use your email for registration</span>
					<input type="text" placeholder="Name" bind:value={displayName} />
					<input type="email" placeholder="Email" bind:value={email} />
					<input type="password" placeholder="Password" bind:value={password} />
					<select class="select" bind:value={userRole}>
						<option value="" disabled>Select Role</option>
						<option value="student">Student</option>
						<option value="organization">Organization</option>
					</select>
					<button type="button" on:click={register}>Sign Up</button>
				</form>
			</div>

			<!-- Sign In Form -->
			<div class="form-container sign-in-container">
				<form action="#">
					<h1>Sign in</h1>
					<div class="social-container">
						<a class="social" on:click|preventDefault={signInWithGoogle}>
							<i class="fab fa-google-plus-g"></i>
						</a>
					</div>
					<span>or use your account</span>
					<input type="email" placeholder="Email" bind:value={email} />
					<input type="password" placeholder="Password" bind:value={password} />
					<button type="button" on:click={signIn}>Sign In</button>
				</form>
			</div>

			<!-- Overlay -->
			<div class="overlay-container">
				<div class="overlay">
					<div class="overlay-panel overlay-left">
						<h1>Welcome Back!</h1>
						<p>To keep connected with us please login with your personal info</p>
						<button class="ghost" on:click={() => (isRightPanelActive = false)}>Sign In</button>
					</div>
					<div class="overlay-panel overlay-right">
						<h1>Hello, Friend!</h1>
						<p>Enter your personal details and start journey with us</p>
						<button class="ghost" on:click={() => (isRightPanelActive = true)}>Sign Up</button>
					</div>
				</div>
			</div>
		</div>
	</body>
</html>
