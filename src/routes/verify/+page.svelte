<script>
	import { contract, provider, signer } from '$lib/eth';
	import { ethers } from 'ethers';
	import { onMount } from 'svelte';

	let userAddress = '';
	let allCertificates = [];
	let verifyAddress = '';
	let verificationResults = [];
	let isLoading = false;
	let errorMessage = '';

	const isContractAvailable = contract !== null;

	function sanitizeInput(input) {
		return input.trim();
	}

	function isValidAddress(address) {
		return ethers.utils.isAddress(address);
	}

	async function fetchAllCertificates(address) {
		if (!isContractAvailable) {
			errorMessage = 'Contract is not available. Ensure you are on the client side.';
			isLoading = false;
			return;
		}

		address = sanitizeInput(address);

		if (!address) {
			errorMessage = 'Please provide a valid Ethereum address.';
			isLoading = false;
			return;
		}

		if (!isValidAddress(address)) {
			errorMessage = 'Invalid Ethereum address';
			isLoading = false;
			return;
		}

		try {
			const results = await contract.getCertificatesByAddress(address);
			if (results.length === 0) {
				allCertificates = ['No certificates found for this address.'];
			} else {
				allCertificates = results.map((cert) => ({
					courseName: cert.courseName,
					dateIssued: cert.dateIssued // Only store course name and date issued
				}));
			}
		} catch (err) {
			console.error('Error fetching certificates:', err);
			errorMessage = 'Failed to fetch certificates.';
		} finally {
			isLoading = false;
		}
	}

	// Function to verify that the certificate's signature is valid
	async function verifySignature(certificate, studentAddress) {
		// Hash the certificate details
		const certificateHash = ethers.utils.solidityKeccak256(
			['address', 'string', 'string', 'string', 'string'],
			[
				studentAddress,
				certificate.courseName,
				certificate.studentName,
				certificate.email,
				certificate.dateIssued
			]
		);

		// Recover the address that signed the message
		const recoveredAddress = ethers.utils.verifyMessage(
			ethers.utils.arrayify(certificateHash),
			certificate.signature
		);

		// Check if the recovered address matches the studentAddress
		return recoveredAddress.toLowerCase() === studentAddress.toLowerCase();
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

		isLoading = true;
		errorMessage = '';
		verificationResults = [];

		try {
			const results = await contract.getCertificatesByAddress(verifyAddress);
			if (results.length === 0) {
				verificationResults.push('No certificates found for this address.');
			} else {
				for (const cert of results) {
					const isValid = await verifySignature(cert, verifyAddress);
					const result = `Course: ${cert.courseName}, Student: ${cert.studentName}, Email: ${cert.email}, Date: ${cert.dateIssued}, Signature: ${isValid ? 'Valid' : 'Invalid'}`;
					verificationResults.push(result);
				}
			}
		} catch (err) {
			console.error('Error verifying certificate:', err);
			errorMessage = 'Verification failed or no certificate found.';
		} finally {
			isLoading = false;
		}
	}

	onMount(async () => {
		isLoading = true;

		try {
			userAddress = await signer.getAddress();
			await fetchAllCertificates(userAddress);
		} catch (err) {
			console.error('Error fetching user address:', err);
			errorMessage = 'Failed to retrieve Ethereum address.';
		} finally {
			isLoading = false;
		}

		// Check if there's an address in the query parameters
		const params = new URLSearchParams(window.location.search);
		const address = params.get('address');
		if (address) {
			verifyAddress = address;
			verifyCertificate();
		}
	});
</script>

<h1>Your Certificates</h1>

<div>
	{#if isLoading}
		<p>Loading...</p>
	{:else if errorMessage}
		<p>{errorMessage}</p>
	{:else if allCertificates.length > 0}
		<ul>
			{#each allCertificates as certificate}
				<li>
					Course: {certificate.courseName}, Date: {certificate.dateIssued}
					<!-- Only showing course name and date -->
				</li>
			{/each}
		</ul>
	{:else}
		<p>No certificates found for your Ethereum address.</p>
	{/if}
</div>

<h2>Verify Certificate</h2>
<input type="text" bind:value={verifyAddress} placeholder="Student Address (Ethereum Address)" />
<button on:click={verifyCertificate} disabled={isLoading}>Verify Certificate</button>
{#if !isLoading && verificationResults.length > 0}
	<ul>
		{#each verificationResults as result}
			<li>{result}</li>
		{/each}
	</ul>
{/if}
