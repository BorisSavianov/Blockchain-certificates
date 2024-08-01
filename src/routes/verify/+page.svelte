<script>
  import { contract } from '$lib/eth';
  import { ethers } from 'ethers';

  let verifyAddress = '';
  let verificationResult = '';

  const isContractAvailable = contract !== null;

  function sanitizeInput(input) {
    return input.trim();
  }

  function isValidAddress(address) {
    return ethers.utils.isAddress(address);
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
</script>

<h1>Verify Certificate</h1>

<div>
  <h2>Verify Certificate</h2>
  <input type="text" bind:value={verifyAddress} placeholder="Student Address (Ethereum Address)">
  <button on:click={verifyCertificate}>Verify Certificate</button>
  <p>{verificationResult}</p>
</div>
