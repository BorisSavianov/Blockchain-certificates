<script>
	import { contract } from '$lib/eth';
	import { ethers } from 'ethers';
	import { auth } from '$lib/firebase';
	import QRCode from 'qrcode';
	import { PDFDocument, rgb } from 'pdf-lib'; // Import pdf-lib

	let courseName = '';
	let studentName = ''; // Add studentName
	let studentAddress = '';
	let dateIssued = '';
	let user = null;
	let qrCodeData = '';

	// Handle Firebase Authentication State
	auth.onAuthStateChanged((firebaseUser) => {
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

	async function generateCertificatePDF(
		studentAddress,
		courseName,
		studentName,
		email,
		dateIssued
	) {
		const pdfDoc = await PDFDocument.create();
		const page = pdfDoc.addPage([600, 400]);

		const qrCodeUrl = `http://localhost:5173/verify?address=${studentAddress}`;
		const qrCodeDataUrl = await QRCode.toDataURL(qrCodeUrl);

		// Add title
		page.drawText('Certificate of Completion', {
			x: page.getWidth() / 2 - 100,
			y: page.getHeight() - 50,
			size: 30,
			color: rgb(0, 0, 0),
			align: 'center'
		});

		// Add certificate details
		page.drawText(`Course Name: ${courseName}`, { x: 50, y: page.getHeight() - 100, size: 20 });
		page.drawText(`Student Name: ${studentName}`, { x: 50, y: page.getHeight() - 130, size: 20 });
		page.drawText(`Email: ${email}`, { x: 50, y: page.getHeight() - 160, size: 20 });
		page.drawText(`Date Issued: ${dateIssued}`, { x: 50, y: page.getHeight() - 190, size: 20 });

		// Add QR code image
		const qrCodeImage = await pdfDoc.embedPng(qrCodeDataUrl);
		page.drawImage(qrCodeImage, {
			x: page.getWidth() - 150,
			y: page.getHeight() - 200,
			width: 100,
			height: 100
		});

		// Save PDF
		const pdfBytes = await pdfDoc.save();
		const blob = new Blob([pdfBytes], { type: 'application/pdf' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = 'certificate.pdf';
		a.click();
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
		studentName = sanitizeInput(studentName); // Capture studentName
		studentAddress = sanitizeInput(studentAddress);
		dateIssued = sanitizeInput(dateIssued);

		if (!courseName || !studentName || !studentAddress || !dateIssued) {
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
				studentName, // Pass studentName to the contract
				user.email, // Pass email
				dateIssued,
				{ gasLimit: 1000000 }
			);
			await tx.wait();
			alert('Certificate issued successfully');

			// Generate and download PDF with QR code
			await generateCertificatePDF(studentAddress, courseName, studentName, user.email, dateIssued);

			courseName = '';
			studentName = ''; // Reset studentName
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
	<input type="text" bind:value={courseName} placeholder="Course Name" />
	<input type="text" bind:value={studentName} placeholder="Student Name" />
	<!-- Add studentName input -->
	<input type="text" bind:value={studentAddress} placeholder="Student Address (Ethereum Address)" />
	<input type="text" bind:value={dateIssued} placeholder="Date Issued (YYYY-MM-DD)" />
	<button on:click={issueCertificate}>Issue Certificate</button>

	{#if qrCodeData}
		<h3>Certificate QR Code</h3>
		<img src={qrCodeData} alt="Certificate QR Code" />
	{/if}
</div>
