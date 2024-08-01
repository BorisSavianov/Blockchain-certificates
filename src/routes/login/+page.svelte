<script>
  import { auth, googleProvider, signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from '$lib/firebase';

  let email = '';
  let password = '';
  let user = null;

  auth.onAuthStateChanged(firebaseUser => {
    user = firebaseUser;
  });

  async function signUpWithEmail() {
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      alert('Account created successfully');
    } catch (error) {
      console.error('Sign Up failed:', error);
      alert('Sign Up failed. Check the console for more details.');
    }
  }

  async function loginWithEmail() {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      alert('Logged in successfully');
    } catch (error) {
      console.error('Login failed:', error);
      alert('Login failed. Check the console for more details.');
    }
  }

  async function loginWithGoogle() {
    try {
      await signInWithPopup(auth, googleProvider);
      alert('Logged in successfully with Google');
    } catch (error) {
      console.error('Google login failed:', error);
      alert('Google login failed. Check the console for more details.');
    }
  }

  async function logout() {
    try {
      await signOut(auth);
      user = null;
      alert('Logged out successfully.');
    } catch (error) {
      console.error('Logout failed:', error);
      alert('Logout failed. Check the console for more details.');
    }
  }
</script>

<h1>Login or Create an Account</h1>

{#if user}
  <div>
    <h2>Welcome, {user.email}</h2>
    <button on:click={logout}>Logout</button>
  </div>
{:else}
  <div>
    <h2>Login with Google</h2>
    <button on:click={loginWithGoogle}>Login with Google</button>
  </div>

  <div>
    <h2>Login/Sign Up with Email</h2>
    <input type="email" bind:value={email} placeholder="Email">
    <input type="password" bind:value={password} placeholder="Password">
    <button on:click={signUpWithEmail}>Sign Up</button>
    <button on:click={loginWithEmail}>Login</button>
  </div>
{/if}
