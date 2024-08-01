<script>
  import { contract } from '$lib/eth';
  import { ethers } from 'ethers';
  import { auth } from '$lib/firebase';

  let courseName = '';
  let studentAddress = '';
  let dateIssued = '';
  let user = null;

  // Handle Firebase Authentication State
  auth.onAuthStateChanged(firebaseUser => {
    user = firebaseUser;
  });

  const isContractAvailable = contract !== null;

  function sanitizeInput(input) {
    return input.trim();
  }

  function isValidAddress(address) {
    return ethers.utils.isAddress(address);
  }

  function isValidDate(date) {
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
    studentAddress = sanitizeInput(studentAddress);
    dateIssued = sanitizeInput(dateIssued);

    if (!courseName || !studentAddress || !dateIssued) {
      alert('Please fill in all fields');
      return;
    }

    if (!isValidDate(dateIssued)) {
      alert('Invalid date format. Use YYYY-MM-DD.');
      return;
    }

    if (!isValidAddress(studentAddress)) {
      alert('Invalid student address');
      return;
    }

    try {
      const tx = await contract.issueCertificate(
        studentAddress,
        courseName,
        user.email,  // Optional if you want to store the email with the certificate
        dateIssued,
        { gasLimit: 1000000 }  // Consider using dynamic estimation
      );
      await tx.wait();
      alert('Certificate issued successfully');
      courseName = '';
      studentAddress = '';
      dateIssued = '';
    } catch (err) {
      console.error('Error issuing certificate:', err);
      alert('Failed to issue certificate');
    }
  }
</script>

<h1>Issue Certificate</h1>

<div>
  <h2>Issue Certificate</h2>
  <input type="text" bind:value={courseName} placeholder="Course Name">
  <input type="text" bind:value={studentAddress} placeholder="Student Address (Ethereum Address)">
  <input type="text" bind:value={dateIssued} placeholder="Date Issued (YYYY-MM-DD)">
  <button on:click={issueCertificate}>Issue Certificate</button>
</div>
