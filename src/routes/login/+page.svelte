<script>
	import {
		auth,
		googleProvider,
		signInWithPopup,
		signInWithEmailAndPassword,
		createUserWithEmailAndPassword,
		updateProfile,
		sendEmailVerification,
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
				if (!firebaseUser.emailVerified) {
					goto('/verify-email');
				} else {
					goto('/');
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
			await sendEmailVerification(newUser);
			await setDoc(doc(db, 'users', newUser.uid), { displayName, role: userRole });

			alert(
				`Регистрацията успешна! Верификационене имейл бе изпратен до ${email}. Моля потвърдете вашият имейл за да продължите.`
			);
			goto('/verify-email');
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

			if (!signedInUser.emailVerified) {
				alert('Please verify your email to continue.');
				goto('/verify-email');
				return;
			}

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
					<h1>Създай акаунт</h1>
					<div class="social-container">
						<a class="social" on:click|preventDefault={signInWithGoogle}>
							<i class="fab fa-google-plus-g"></i>
						</a>
					</div>
					<span>или използвайте вашият имейл за регистрация</span>
					<input type="text" placeholder="Име" bind:value={displayName} />
					<input type="email" placeholder="Имейл" bind:value={email} />
					<input type="password" placeholder="Парола" bind:value={password} />
					<select class="select" bind:value={userRole}>
						<option value="" disabled>Изберете роля</option>
						<option value="student">Студент</option>
						<option value="organization">Организация</option>
					</select>
					<button type="button" on:click={register}>Създай акаунт</button>
				</form>
			</div>

			<!-- Sign In Form -->
			<div class="form-container sign-in-container">
				<form action="#">
					<h1>Вписване</h1>
					<div class="social-container">
						<a class="social" on:click|preventDefault={signInWithGoogle}>
							<i class="fab fa-google-plus-g"></i>
						</a>
					</div>
					<span>или използвайте вашият акаунт</span>
					<input type="email" placeholder="Имейл" bind:value={email} />
					<input type="password" placeholder="Парола" bind:value={password} />
					<button type="button" on:click={signIn}>Влизане</button>
				</form>
			</div>

			<!-- Overlay -->
			<div class="overlay-container">
				<div class="overlay">
					<div class="overlay-panel overlay-left">
						<h1>Здравейте отново!</h1>
						<p>За да се впишете със съществуващ акаунт, моля, влезте с вашата лична информация</p>
						<button class="ghost" on:click={() => (isRightPanelActive = false)}>Вписване</button>
					</div>
					<div class="overlay-panel overlay-right">
						<h1>Добре дошли!</h1>
						<p>Въведете вашите лични данни и създадете акаунт с нас сега</p>
						<button class="ghost" on:click={() => (isRightPanelActive = true)}>Създай</button>
					</div>
				</div>
			</div>
		</div>
	</body>
</html>
