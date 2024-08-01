<script>
  import { contract } from '$lib/eth';
  import { ethers } from 'ethers';
  import { auth, googleProvider, signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged } from '$lib/firebase';

  let courseName = '';
  let studentName = '';
  let dateIssued = '';
  let verifyAddress = '';
  let verificationResult = '';
  let email = '';
  let password = '';

  let user = null;

  const isContractAvailable = contract !== null;

  // Handle Firebase Authentication State
  onAuthStateChanged(auth, (firebaseUser) => {
    user = firebaseUser;
  });

  // Function to sanitize and validate inputs
  function sanitizeInput(input) {
    return input.trim();
  }

  function isValidAddress(address) {
    return ethers.utils.isAddress(address);
  }

  function isValidDate(date) {
    // Simple date validation (YYYY-MM-DD format)
    const datePattern = /^\d{4}-\d{2}-\d{2}$/;
    return datePattern.test(date);
  }

  async function issueCertificate() {
    if (!isContractAvailable) {
      alert('Contract is not available. Ensure you are on the client side.');
      return;
    }

    if (!user) {
      alert('You must be logged in to issue a certificate.');
      return;
    }

    courseName = sanitizeInput(courseName);
    studentName = sanitizeInput(studentName);
    dateIssued = sanitizeInput(dateIssued);

    if (!courseName || !studentName || !dateIssued) {
      alert('Please fill in all fields');
      return;
    }

    if (!isValidDate(dateIssued)) {
      alert('Invalid date format. Use YYYY-MM-DD.');
      return;
    }

    try {
      const tx = await contract.issueCertificate(
        user.email,  // Assuming user email is used as the student address
        courseName,
        studentName,
        dateIssued,
        { gasLimit: 1000000 }  // Consider using dynamic estimation
      );
      await tx.wait();
      alert('Certificate issued successfully');
      courseName = '';
      studentName = '';
      dateIssued = '';
    } catch (err) {
      console.error('Error issuing certificate:', err);
      alert('Failed to issue certificate');
    }
  }

  async function verifyCertificate() {
    if (!isContractAvailable) {
      alert('Contract is not available. Ensure you are on the client side.');
      return;
    }
    
    verifyAddress = sanitizeInput(verifyAddress);

    if (!verifyAddress) {
      alert('Please provide a student address');
      return;
    }

    if (!isValidAddress(verifyAddress)) {
      alert('Invalid student address');
      return;
    }
    
    try {
      const result = await contract.verifyCertificate(verifyAddress);
      verificationResult = `Course: ${result.courseName}, Student: ${result.studentName}, Date: ${result.dateIssued}`;
    } catch (err) {
      console.error('Error verifying certificate:', err);
      verificationResult = 'Verification failed or no certificate found.';
    }
  }

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

<h1>Blockchain Certification System</h1>

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

<div>
  <h2>Logout</h2>
  <button on:click={logout}>Logout</button>
</div>

<div>
  <h2>Issue Certificate</h2>
  <input type="text" bind:value={courseName} placeholder="Course Name">
  <input type="text" bind:value={studentName} placeholder="Student Name">
  <input type="text" bind:value={dateIssued} placeholder="Date Issued (YYYY-MM-DD)">
  <button on:click={issueCertificate}>Issue Certificate</button>
</div>

<div>
  <h2>Verify Certificate</h2>
  <input type="text" bind:value={verifyAddress} placeholder="Student Address">
  <button on:click={verifyCertificate}>Verify Certificate</button>
  <p>{verificationResult}</p>
</div>
