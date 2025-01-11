<script>
	import { onMount } from 'svelte';
	import { authStore } from '$lib/stores/authStore.js';
	import { onDestroy } from 'svelte';
	import { goto } from '$app/navigation';

	let authSubscribe;

	// Subscribe to authStore to track authentication state
	const unsubscribe = authStore.subscribe((value) => {
		authSubscribe = value;
		// Redirect to login if loading is done and user is not logged in
		if (!authSubscribe.loading && !authSubscribe.isLoggedIn) {
			goto('/login');
		}
	});

	// Cleanup the subscription on component destroy
	onDestroy(unsubscribe);

	onMount(() => {
		const iconNavbarSidenav = document.getElementById('iconNavbarSidenav');
		const iconSidenav = document.getElementById('iconSidenav');
		const sidenav = document.getElementById('sidenav-main');
		const innerBody = document.getElementById('inner-body');
		let className = 'g-sidenav-pinned';

		function toggleSidenav() {
			if (innerBody.classList.contains(className)) {
				innerBody.classList.remove(className);
				setTimeout(() => {
					sidenav.classList.remove('bg-white');
				}, 100);
				sidenav.classList.remove('bg-transparent');
			} else {
				innerBody.classList.add(className);
				sidenav.classList.add('bg-white');
				sidenav.classList.remove('bg-transparent');
				iconSidenav.classList.remove('d-none');
			}
		}

		iconNavbarSidenav?.addEventListener('click', toggleSidenav);
		iconSidenav?.addEventListener('click', toggleSidenav);

		// Cleanup event listeners when the component is destroyed
		return () => {
			iconNavbarSidenav?.removeEventListener('click', toggleSidenav);
			iconSidenav?.removeEventListener('click', toggleSidenav);
		};
	});

	import { contract, provider, signer } from '$lib/eth';
	import { ethers } from 'ethers';
	import { rtdb } from '$lib/firebase';
	import { ref, onValue } from 'firebase/database';

	let userAddress = '';
	let allCertificates = [];
	let verifyAddress = '';
	let verificationResults = [];
	let isLoading = true;
	let errorMessage = '';
	let certificateStatusMessage = '';
	let showStatus = false; // Control the visibility of the status

	const isContractAvailable = contract !== null;

	function sanitizeInput(input) {
		return input.trim();
	}

	function isValidAddress(address) {
		return ethers.utils.isAddress(address);
	}

	function fetchCertificateStatusRealtime(studentAddress) {
		if (!studentAddress) return;

		const statusRef = ref(rtdb, `certificates/${studentAddress}/status`);
		onValue(statusRef, (snapshot) => {
			if (snapshot.exists()) {
				const status = snapshot.val();
				if (status === 'pending') {
					certificateStatusMessage = 'Издване на сертификат протича...';
					showStatus = true;
				} else if (status === 'completed') {
					certificateStatusMessage = 'Сертификат издаден успешно!';
					showStatus = true;

					// Hide the message after 5 seconds
					setTimeout(() => {
						showStatus = false;
					}, 5000);
				} else {
					showStatus = false; // Hide status if it's neither pending nor completed
				}
			} else {
				showStatus = false; // Hide if no certificate is found
			}
		});
	}

	import { getDocs, collection } from 'firebase/firestore';
	import { db } from '$lib/firebase';

	async function fetchAllCertificates(address) {
		if (!isContractAvailable) {
			errorMessage = 'Contract is not available. Ensure you are on the client side.';
			isLoading = false; // Hide loading spinner
			return;
		}

		address = sanitizeInput(address);

		if (!address) {
			errorMessage = 'Моля напишете валиден Ethereum адрес.';
			isLoading = false;
			return;
		}

		if (!isValidAddress(address)) {
			errorMessage = 'Невалиден Ethereum адрес';
			isLoading = false;
			return;
		}

		errorMessage = ''; // Clear any previous errors
		verificationResults = []; // Clear previous results

		try {
			// Show loading state
			isLoading = true;

			// Fetch certificates from the contract
			const results = await contract.getCertificatesByAddress(address);
			if (results.length === 0) {
				verificationResults.push('Няма намерени сертификати за този адрес');
			} else {
				// Map contract certificates to readable data format
				const contractCertificates = results.map((cert) => ({
					studentName: cert.studentName,
					courseName: cert.courseName,
					email: cert.email,
					dateIssued: cert.dateIssued,
					signature: cert.signature,
					studentAddress: address,
					issuerAddress: cert.issuer, // Ensure it is issuer address here
					status: false,
					drawingUrl: null // Placeholder for drawingUrl from Firebase
				}));

				// Fetch certificates from Firebase (Firestore)
				const snapshot = await getDocs(collection(db, 'users', user.uid, 'certificates'));
				const firebaseCertificates = snapshot.docs.map((doc) => ({
					id: doc.id,
					...doc.data()
				}));

				// Map contract certificates with matching Firebase certificates
				contractCertificates.forEach((contractCert) => {
					const matchingCert = firebaseCertificates.find(
						(firebaseCert) => firebaseCert.signature === contractCert.signature
					);
					if (matchingCert) {
						contractCert.drawingUrl = matchingCert.drawingUrl; // Attach drawingUrl from Firebase
						contractCert.firebaseId = matchingCert.id;
					}
				});

				allCertificates = contractCertificates; // Update allCertificates with matched data
			}
		} catch (err) {
			console.error('Error fetching certificates:', err);
			errorMessage = 'Неуспешно намиране на сертификати.';
		} finally {
			isLoading = false; // Hide loading spinner
		}
	}

	// Function to verify that the certificate's signature is valid
	async function verifySignature(certificate) {
		// Hash the certificate details
		const certificateHash = ethers.utils.solidityKeccak256(
			['address', 'string', 'string', 'string', 'string'],
			[
				certificate.issuerAddress, // Use issuer address
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

		// Check if the recovered address matches the issuer's address
		return recoveredAddress.toLowerCase() === certificate.issuerAddress.toLowerCase();
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
			// Fetch the certificate status in real-time
			await fetchCertificateStatusRealtime(verifyAddress);

			const results = await contract.getCertificatesByAddress(verifyAddress);
			if (results.length === 0) {
				verificationResults.push('Няма сертификати за този адрес.');
			} else {
				for (let cert of results) {
					const isValid = await verifySignature(cert);
					const result = `Course: ${cert.courseName}, Student: ${cert.studentName}, Email: ${cert.email}, Date: ${cert.dateIssued}, Signature: ${isValid ? 'Valid' : 'Invalid'}`;
					verificationResults.push(result);
				}
			}
			isLoading = false;
		} catch (err) {
			console.error('Error verifying certificate:', err);
			errorMessage = 'Верификацията неуспешна или няма сертификати.';
		}
	}

	import { auth } from '$lib/firebase';
	let user = null;
	onMount(async () => {
		isLoading = true;

		try {
			// Get the current user from Firebase Authentication
			user = auth.currentUser;

			if (!user) {
				errorMessage = 'User is not logged in.';
				return;
			}
			userAddress = await signer.getAddress();
			await fetchAllCertificates(userAddress);

			// Optionally, you can add verification status to each certificate
			for (let cert of allCertificates) {
				const isValid = await verifySignature(cert);
				cert.status = isValid ? true : false;
			}
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

	let selectedCertificate = null;

	function showCertificateDetails(certificate) {
		selectedCertificate = certificate;
	}

	function copyToClipboard(text) {
		navigator.clipboard
			.writeText(text)
			.then(() => {
				alert('Signature copied to clipboard!');
			})
			.catch((err) => {
				console.error('Failed to copy: ', err);
			});
	}

	import QRCode from 'qrcode';
	import { PDFDocument, rgb } from 'pdf-lib'; // Import pdf-lib
	async function updatePdf(studentName, courseName, studentAddress, dateIssued, certificateId) {
		// Fetch the drawing URL
		const drawingUrl = await getDrawingUrl(certificateId);
		if (!drawingUrl) {
			alert('Error fetching drawing URL');
			return;
		}
		// Load the original PDF
		const existingPdfBytes = await fetch('proba.pdf').then((res) => res.arrayBuffer());
		const pdfDoc = await PDFDocument.load(existingPdfBytes);

		// Get the first page
		const page = pdfDoc.getPage(0);

		// Coordinates for text replacement
		const replacements = [
			{ text: courseName, x: 320, y: 400, size: 58 },
			{ text: studentName, x: 330, y: 290, size: 24 },
			{ text: studentAddress, x: 240, y: 230, size: 12 },
			{ text: dateIssued, x: 500, y: 150, size: 12 }
		];

		// Add the new text
		for (const { text, x, y, size } of replacements) {
			page.drawText(text, {
				x,
				y,
				size,
				color: rgb(0, 0, 0)
			});
		}

		// Embed the drawing into the PDF
		const drawingImage = await pdfDoc.embedPng(drawingUrl);
		page.drawImage(drawingImage, {
			x: 120,
			y: 130,
			width: 200,
			height: 120
		});

		// Generate QR code
		const qrCodeUrl = `http://localhost:5173/verificiraj?address=${studentAddress}`;
		const qrCodeDataUrl = await QRCode.toDataURL(qrCodeUrl);
		const qrImage = await pdfDoc.embedPng(qrCodeDataUrl);

		// Place the QR code in the PDF
		page.drawImage(qrImage, {
			x: 50,
			y: 50,
			width: 100,
			height: 100
		});

		// Save the PDF
		const pdfBytes = await pdfDoc.save();

		// Download the updated PDF
		const blob = new Blob([pdfBytes], { type: 'application/pdf' });
		const link = document.createElement('a');
		link.href = URL.createObjectURL(blob);
		link.download = 'updated_certificate.pdf';
		link.click();
	}

	// Updated handleSubmit to include certificateId
	const handleSubmit = (courseName, studentName, studentAddress, dateIssued, certificateId) => {
		if (!isValidDate(dateIssued)) {
			alert('Invalid date format. Use YYYY-MM-DD.');
			return;
		}

		if (!isValidAddress(studentAddress)) {
			alert('Invalid student address');
			return;
		}

		updatePdf(studentName, courseName, studentAddress, dateIssued, certificateId);
	};

	function isValidDate(date) {
		const datePattern = /^\d{4}-\d{2}-\d{2}$/;
		return datePattern.test(date);
	}

	import { doc, getDoc } from 'firebase/firestore';

	async function getDrawingUrl(certificateId) {
		if (!user) {
			alert('No user is currently signed in.');
			return;
		}

		try {
			const userRef = doc(db, 'users', user.uid);
			const certificateRef = doc(userRef, 'certificates', certificateId);
			const docSnap = await getDoc(certificateRef);

			if (docSnap.exists()) {
				const data = docSnap.data();
				return data.drawingUrl;
			} else {
				alert('No such certificate found.');
				return null;
			}
		} catch (error) {
			console.error('Error retrieving drawingUrl:', error);
			alert('Error retrieving drawingUrl: ' + error.message);
			return null;
		}
	}
</script>

<html lang="en">
	<head>
		<meta charset="utf-8" />
		<meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
		<link rel="apple-touch-icon" sizes="76x76" href="../assets/img/apple-icon.png" />
		<link rel="icon" type="image/png" href="../assets/img/favicon.png" />
		<title>Верифицирай</title>
		<!--     Fonts and icons     -->
		<link
			href="https://fonts.googleapis.com/css?family=Inter:300,400,500,600,700,800"
			rel="stylesheet"
		/>
		<!-- Nucleo Icons -->
		<link
			href="https://demos.creative-tim.com/soft-ui-dashboard/assets/css/nucleo-icons.css"
			rel="stylesheet"
		/>
		<link
			href="https://demos.creative-tim.com/soft-ui-dashboard/assets/css/nucleo-svg.css"
			rel="stylesheet"
		/>
		<!-- Font Awesome Icons -->
		<script src="https://kit.fontawesome.com/42d5adcbca.js" crossorigin="anonymous"></script>
		<!-- CSS Files -->
		<link id="pagestyle" href="../assets/css/soft-ui-dashboard.css?v=1.1.0" rel="stylesheet" />
	</head>

	<body id="inner-body" class="g-sidenav-show bg-gray-100">
		<aside
			class="sidenav navbar navbar-vertical navbar-expand-xs border-0 border-radius-xl my-3 fixed-start ms-3"
			id="sidenav-main"
		>
			<div class="sidenav-header">
				<i
					class="fas fa-times p-3 cursor-pointer text-secondary opacity-5 position-absolute end-0 top-0 d-none d-xl-none"
					aria-hidden="true"
					id="iconSidenav"
				></i>
				<a class="navbar-brand m-0" href="/">
					<img src="assets/img/logo3.png" class="navbar-brand-img h-100" alt="main_logo" />
				</a>
			</div>
			<hr class="horizontal dark mt-0" />
			<div class="collapse navbar-collapse w-auto" id="sidenav-collapse-main">
				<ul class="navbar-nav">
					<li class="nav-item">
						<a class="nav-link" href="/">
							<div
								class="icon icon-shape icon-sm shadow border-radius-md bg-white text-center me-2 d-flex align-items-center justify-content-center"
							>
								<svg
									width="12px"
									height="12px"
									viewBox="0 0 45 40"
									version="1.1"
									xmlns="http://www.w3.org/2000/svg"
									xmlns:xlink="http://www.w3.org/1999/xlink"
								>
									<title>shop </title>
									<g stroke="none" stroke-width="1" fill="none" fill-rule="evenodd">
										<g
											transform="translate(-1716.000000, -439.000000)"
											fill="#FFFFFF"
											fill-rule="nonzero"
										>
											<g transform="translate(1716.000000, 291.000000)">
												<g transform="translate(0.000000, 148.000000)">
													<path
														class="color-background opacity-6"
														d="M46.7199583,10.7414583 L40.8449583,0.949791667 C40.4909749,0.360605034 39.8540131,0 39.1666667,0 L7.83333333,0 C7.1459869,0 6.50902508,0.360605034 6.15504167,0.949791667 L0.280041667,10.7414583 C0.0969176761,11.0460037 -1.23209662e-05,11.3946378 -1.23209662e-05,11.75 C-0.00758042603,16.0663731 3.48367543,19.5725301 7.80004167,19.5833333 L7.81570833,19.5833333 C9.75003686,19.5882688 11.6168794,18.8726691 13.0522917,17.5760417 C16.0171492,20.2556967 20.5292675,20.2556967 23.494125,17.5760417 C26.4604562,20.2616016 30.9794188,20.2616016 33.94575,17.5760417 C36.2421905,19.6477597 39.5441143,20.1708521 42.3684437,18.9103691 C45.1927731,17.649886 47.0084685,14.8428276 47.0000295,11.75 C47.0000295,11.3946378 46.9030823,11.0460037 46.7199583,10.7414583 Z"
													></path>
													<path
														class="color-background"
														d="M39.198,22.4912623 C37.3776246,22.4928106 35.5817531,22.0149171 33.951625,21.0951667 L33.92225,21.1107282 C31.1430221,22.6838032 27.9255001,22.9318916 24.9844167,21.7998837 C24.4750389,21.605469 23.9777983,21.3722567 23.4960833,21.1018359 L23.4745417,21.1129513 C20.6961809,22.6871153 17.4786145,22.9344611 14.5386667,21.7998837 C14.029926,21.6054643 13.533337,21.3722507 13.0522917,21.1018359 C11.4250962,22.0190609 9.63246555,22.4947009 7.81570833,22.4912623 C7.16510551,22.4842162 6.51607673,22.4173045 5.875,22.2911849 L5.875,44.7220845 C5.875,45.9498589 6.7517757,46.9451667 7.83333333,46.9451667 L19.5833333,46.9451667 L19.5833333,33.6066734 L27.4166667,33.6066734 L27.4166667,46.9451667 L39.1666667,46.9451667 C40.2482243,46.9451667 41.125,45.9498589 41.125,44.7220845 L41.125,22.2822926 C40.4887822,22.4116582 39.8442868,22.4815492 39.198,22.4912623 Z"
													></path>
												</g>
											</g>
										</g>
									</g>
								</svg>
							</div>
							<span class="nav-link-text ms-1">Начало</span>
						</a>
					</li>
					<li class="nav-item">
						<a class="nav-link" href="/izdaj">
							<div
								class="icon icon-shape icon-sm shadow border-radius-md bg-white text-center me-2 d-flex align-items-center justify-content-center"
							>
								<svg
									width="12px"
									height="12px"
									viewBox="0 0 42 42"
									version="1.1"
									xmlns="http://www.w3.org/2000/svg"
									xmlns:xlink="http://www.w3.org/1999/xlink"
								>
									<title>office</title>
									<g stroke="none" stroke-width="1" fill="none" fill-rule="evenodd">
										<g
											transform="translate(-1869.000000, -293.000000)"
											fill="#FFFFFF"
											fill-rule="nonzero"
										>
											<g transform="translate(1716.000000, 291.000000)">
												<g id="office" transform="translate(153.000000, 2.000000)">
													<path
														class="color-background opacity-6"
														d="M12.25,17.5 L8.75,17.5 L8.75,1.75 C8.75,0.78225 9.53225,0 10.5,0 L31.5,0 C32.46775,0 33.25,0.78225 33.25,1.75 L33.25,12.25 L29.75,12.25 L29.75,3.5 L12.25,3.5 L12.25,17.5 Z"
													></path>
													<path
														class="color-background"
														d="M40.25,14 L24.5,14 C23.53225,14 22.75,14.78225 22.75,15.75 L22.75,38.5 L19.25,38.5 L19.25,22.75 C19.25,21.78225 18.46775,21 17.5,21 L1.75,21 C0.78225,21 0,21.78225 0,22.75 L0,40.25 C0,41.21775 0.78225,42 1.75,42 L40.25,42 C41.21775,42 42,41.21775 42,40.25 L42,15.75 C42,14.78225 41.21775,14 40.25,14 Z M12.25,36.75 L7,36.75 L7,33.25 L12.25,33.25 L12.25,36.75 Z M12.25,29.75 L7,29.75 L7,26.25 L12.25,26.25 L12.25,29.75 Z M35,36.75 L29.75,36.75 L29.75,33.25 L35,33.25 L35,36.75 Z M35,29.75 L29.75,29.75 L29.75,26.25 L35,26.25 L35,29.75 Z M35,22.75 L29.75,22.75 L29.75,19.25 L35,19.25 L35,22.75 Z"
													></path>
												</g>
											</g>
										</g>
									</g>
								</svg>
							</div>
							<span class="nav-link-text ms-1">Издай</span>
						</a>
					</li>
					<li class="nav-item">
						<a class="nav-link active" href="/verificiraj">
							<div
								class="icon icon-shape icon-sm shadow border-radius-md bg-white text-center me-2 d-flex align-items-center justify-content-center"
							>
								<svg
									width="12px"
									height="12px"
									viewBox="0 0 43 36"
									version="1.1"
									xmlns="http://www.w3.org/2000/svg"
									xmlns:xlink="http://www.w3.org/1999/xlink"
								>
									<title>credit-card</title>
									<g stroke="none" stroke-width="1" fill="none" fill-rule="evenodd">
										<g
											transform="translate(-2169.000000, -745.000000)"
											fill="#FFFFFF"
											fill-rule="nonzero"
										>
											<g transform="translate(1716.000000, 291.000000)">
												<g transform="translate(453.000000, 454.000000)">
													<path
														class="color-background opacity-6"
														d="M43,10.7482083 L43,3.58333333 C43,1.60354167 41.3964583,0 39.4166667,0 L3.58333333,0 C1.60354167,0 0,1.60354167 0,3.58333333 L0,10.7482083 L43,10.7482083 Z"
													></path>
													<path
														class="color-background"
														d="M0,16.125 L0,32.25 C0,34.2297917 1.60354167,35.8333333 3.58333333,35.8333333 L39.4166667,35.8333333 C41.3964583,35.8333333 43,34.2297917 43,32.25 L43,16.125 L0,16.125 Z M19.7083333,26.875 L7.16666667,26.875 L7.16666667,23.2916667 L19.7083333,23.2916667 L19.7083333,26.875 Z M35.8333333,26.875 L28.6666667,26.875 L28.6666667,23.2916667 L35.8333333,23.2916667 L35.8333333,26.875 Z"
													></path>
												</g>
											</g>
										</g>
									</g>
								</svg>
							</div>
							<span class="nav-link-text ms-1">Верифицирай</span>
						</a>
					</li>
					<li class="nav-item">
						<a class="nav-link" href="/profile">
							<div
								class="icon icon-shape icon-sm shadow border-radius-md bg-white text-center me-2 d-flex align-items-center justify-content-center"
							>
								<svg
									width="12px"
									height="12px"
									viewBox="0 0 46 42"
									version="1.1"
									xmlns="http://www.w3.org/2000/svg"
									xmlns:xlink="http://www.w3.org/1999/xlink"
								>
									<title>customer-support</title>
									<g stroke="none" stroke-width="1" fill="none" fill-rule="evenodd">
										<g
											transform="translate(-1717.000000, -291.000000)"
											fill="#FFFFFF"
											fill-rule="nonzero"
										>
											<g transform="translate(1716.000000, 291.000000)">
												<g transform="translate(1.000000, 0.000000)">
													<path
														class="color-background opacity-6"
														d="M45,0 L26,0 C25.447,0 25,0.447 25,1 L25,20 C25,20.379 25.214,20.725 25.553,20.895 C25.694,20.965 25.848,21 26,21 C26.212,21 26.424,20.933 26.6,20.8 L34.333,15 L45,15 C45.553,15 46,14.553 46,14 L46,1 C46,0.447 45.553,0 45,0 Z"
													></path>
													<path
														class="color-background"
														d="M22.883,32.86 C20.761,32.012 17.324,31 13,31 C8.676,31 5.239,32.012 3.116,32.86 C1.224,33.619 0,35.438 0,37.494 L0,41 C0,41.553 0.447,42 1,42 L25,42 C25.553,42 26,41.553 26,41 L26,37.494 C26,35.438 24.776,33.619 22.883,32.86 Z"
													></path>
													<path
														class="color-background"
														d="M13,28 C17.432,28 21,22.529 21,18 C21,13.589 17.411,10 13,10 C8.589,10 5,13.589 5,18 C5,22.529 8.568,28 13,28 Z"
													></path>
												</g>
											</g>
										</g>
									</g>
								</svg>
							</div>
							<span class="nav-link-text ms-1">Профил</span>
						</a>
					</li>
				</ul>
			</div>
		</aside>
		<main class="main-content position-relative max-height-vh-100 h-100 border-radius-lg">
			<!-- Navbar -->
			<nav
				class="navbar navbar-main navbar-expand-lg px-0 mx-4 shadow-none border-radius-xl"
				id="navbarBlur"
				navbar-scroll="true"
			>
				<div class="container-fluid py-1 px-3">
					<nav aria-label="breadcrumb">
						<ol class="breadcrumb bg-transparent mb-0 pb-0 pt-1 px-0 me-sm-6 me-5">
							<li class="breadcrumb-item text-sm">
								<a class="opacity-5 text-dark" href="">Страници</a>
							</li>
							<li class="breadcrumb-item text-sm text-dark active" aria-current="page">
								Верифицирай
							</li>
						</ol>
						<h6 class="font-weight-bolder mb-0">Верифицирай</h6>
					</nav>
					<div class="collapse navbar-collapse mt-sm-0 mt-2 me-md-0 me-sm-4" id="navbar">
						<div class="ms-md-auto pe-md-3 d-flex align-items-center"></div>
						<ul class="navbar-nav justify-content-end">
							<li class="nav-item d-xl-none ps-3 d-flex align-items-center">
								<a href="" class="nav-link text-body p-0" id="iconNavbarSidenav">
									<div class="sidenav-toggler-inner">
										<i class="sidenav-toggler-line"></i>
										<i class="sidenav-toggler-line"></i>
										<i class="sidenav-toggler-line"></i>
									</div>
								</a>
							</li>
						</ul>
					</div>
				</div>
			</nav>
			<!-- End Navbar -->
			<div class="container-fluid py-4 mv">
				<div class="col-md-12 mb-lg-0 mb-4">
					<div class="card mt-4">
						<div class="card-header pb-0 p-3">
							<div class="row">
								<div class="col-6 d-flex align-items-center">
									<h6>Верифицирай</h6>
								</div>
								<div class="col-6 text-end">
									<button
										class="btn bg-gradient-dark mb-0"
										on:click={verifyCertificate}
										disabled={isLoading}><i class="fas fa-plus"></i>&nbsp;&nbsp;Провери</button
									>
								</div>
							</div>
						</div>
						<div class="card-body p-3">
							<div class="row">
								<div class="col-md-6 mb-md-0 mb-4">
									<input
										class="card card-body border card-plain border-radius-lg d-flex align-items-center flex-row"
										type="text"
										bind:value={verifyAddress}
										placeholder="Адресът на студента (Eth)"
									/>
								</div>
							</div>
						</div>
					</div>
				</div>

				<div class="row">
					<div class="col-12">
						<div class="card mb-4 mt-4">
							<div class="card-header pb-0">
								<h6>Вашите сертификати</h6>
							</div>

							<div>
								{#if isLoading}
									<p>Зареждане...</p>
								{:else if errorMessage}
									<p>{errorMessage}</p>
								{:else if allCertificates.length > 0}
									<ul>
										<div class="scrollable-container">
											<div class="card-body px-0 pt-0 pb-2">
												<div class="table-responsive p-0">
													<!-- Certificate List -->
													<table class="table align-items-center mb-0">
														<thead>
															<tr>
																<th
																	class="text-uppercase text-secondary text-xxs font-weight-bolder opacity-7"
																	>Студент</th
																>
																<th
																	class="text-uppercase text-secondary text-xxs font-weight-bolder opacity-7 ps-2"
																	>Курс</th
																>
																<th
																	class="text-center text-uppercase text-secondary text-xxs font-weight-bolder opacity-7"
																	>Статус</th
																>
																<th
																	class="text-center text-uppercase text-secondary text-xxs font-weight-bolder opacity-7"
																	>Дата</th
																>
															</tr>
														</thead>
														<tbody>
															{#each allCertificates as certificate}
																<tr on:click={() => showCertificateDetails(certificate)}>
																	<td>
																		<div class="d-flex px-2 py-1">
																			<div class="d-flex flex-column justify-content-center">
																				<h6 class="mb-0 text-sm">{certificate.studentName}</h6>
																			</div>
																		</div>
																	</td>
																	<td>
																		<p class="text-xs font-weight-bold mb-0">
																			{certificate.courseName}
																		</p>
																	</td>
																	<td class="align-middle text-center text-sm">
																		{#if certificate.status}
																			<span class="badge badge-sm bg-gradient-success">Валиден</span
																			>
																		{:else}
																			<span class="badge badge-sm bg-gradient-danger"
																				>Невалиден</span
																			>
																		{/if}
																	</td>
																	<td class="align-middle text-center">
																		<span class="text-secondary text-xs font-weight-bold"
																			>{certificate.dateIssued}</span
																		>
																	</td>
																</tr>
															{/each}
														</tbody>
													</table>
												</div>
											</div>
										</div>

										<style>
											.scrollable-container {
												max-height: 350px;
												overflow-y: auto;
											}
										</style>
									</ul>
								{/if}
							</div>
							{#if !isLoading && verificationResults.length > 0}
								<ul>
									{#each verificationResults as result}
										<li>{result}</li>
									{/each}
								</ul>
							{/if}
							{#if showStatus}
								<p>{certificateStatusMessage}</p>
								<!-- Show the certificate status -->
							{/if}
						</div>
					</div>
				</div>

				<!-- Certificate Details Section -->
				{#if selectedCertificate}
					<div class="row">
						<div class="col-12">
							<div class="card mb-4">
								<div class="card-header pb-0">
									<h6>Детайли</h6>
								</div>
								<div class="card-body px-0 pt-0 pb-2">
									<div class="table-responsive p-0">
										<table class="table align-items-center justify-content-center mb-0">
											<thead>
												<tr>
													<th
														class="text-uppercase text-secondary text-xxs font-weight-bolder opacity-7"
														>Студент</th
													>
													<th
														class="text-uppercase text-secondary text-xxs font-weight-bolder opacity-7 ps-2"
														>Курс</th
													>
													<th
														class="text-uppercase text-secondary text-xxs font-weight-bolder opacity-7 ps-2"
														>Имейл</th
													>
													<th
														class="text-uppercase text-secondary text-xxs font-weight-bolder text-center opacity-7 ps-2"
														>Дата</th
													>
													<th
														class="text-uppercase text-secondary text-xxs font-weight-bolder text-center opacity-7 ps-2"
														>Подпис и PDF</th
													>
												</tr></thead
											><tbody>
												<tr>
													<td>
														<div class="d-flex px-2">
															<div>
																<img
																	src="../assets/img/small-logos/logo-spotify.svg"
																	class="avatar avatar-sm rounded-circle me-2"
																	alt="spotify"
																/>
															</div>
															<div class="my-auto">
																<h6 class="mb-0 text-sm">
																	{selectedCertificate.studentName}
																</h6>
															</div>
														</div>
													</td>
													<td>
														<p class="text-sm font-weight-bold mb-0">
															{selectedCertificate.courseName}
														</p>
													</td>
													<td>
														<span class="text-xs font-weight-bold">{selectedCertificate.email}</span
														>
													</td>
													<td class="align-middle text-center">
														<div class="d-flex align-items-center justify-content-center">
															<span class="me-2 text-xs font-weight-bold"
																>{selectedCertificate.dateIssued}</span
															>
														</div>
													</td>
													<td class="align-middle">
														<div style="display: table; margin: 0 auto;">
															<button
																class="btn btn-link text-secondary mb-0"
																on:click={() => copyToClipboard(selectedCertificate.signature)}
															>
																Копирай
															</button>
															<button
																class="btn btn-link text-secondary mb-0"
																on:click={() =>
																	handleSubmit(
																		selectedCertificate.courseName,
																		selectedCertificate.studentName,
																		selectedCertificate.studentAddress,
																		selectedCertificate.dateIssued,
																		selectedCertificate.firebaseId
																	)}
															>
																PDF
															</button>
														</div>
													</td>
												</tr>
											</tbody>
										</table>
									</div>
								</div>
							</div>
						</div>
					</div>
				{/if}

				<footer class="footer pt-3">
					<div class="container-fluid">
						<div class="row align-items-center justify-content-lg-between">
							<div class="col-lg-6">
								<ul class="nav nav-footer justify-content-center justify-content-lg-end">
									<li class="nav-item">
										<a
											href="https://www.creative-tim.com"
											class="nav-link text-muted"
											target="_blank">Creative Tim</a
										>
									</li>
									<li class="nav-item">
										<a
											href="https://www.creative-tim.com/presentation"
											class="nav-link text-muted"
											target="_blank">About Us</a
										>
									</li>
									<li class="nav-item">
										<a
											href="https://www.creative-tim.com/blog"
											class="nav-link text-muted"
											target="_blank">Blog</a
										>
									</li>
									<li class="nav-item">
										<a
											href="https://www.creative-tim.com/license"
											class="nav-link pe-0 text-muted"
											target="_blank">License</a
										>
									</li>
								</ul>
							</div>
						</div>
					</div>
				</footer>
			</div>
		</main>
		<div class="fixed-plugin">
			<a class="fixed-plugin-button text-dark position-fixed px-3 py-2">
				<i class="fa fa-cog py-2"> </i>
			</a>
			<div class="card shadow-lg">
				<div class="card-header pb-0 pt-3">
					<div class="float-start">
						<h5 class="mt-3 mb-0">Soft UI Configurator</h5>
						<p>See our dashboard options.</p>
					</div>
					<div class="float-end mt-4">
						<button class="btn btn-link text-dark p-0 fixed-plugin-close-button">
							<i class="fa fa-close"></i>
						</button>
					</div>
					<!-- End Toggle Button -->
				</div>
				<hr class="horizontal dark my-1" />
				<div class="card-body pt-sm-3 pt-0">
					<!-- Sidebar Backgrounds -->
					<div>
						<h6 class="mb-0">Sidebar Colors</h6>
					</div>
					<a href="javascript:void(0)" class="switch-trigger background-color">
						<div class="badge-colors my-2 text-start">
							<span
								class="badge filter bg-primary active"
								data-color="primary"
								onclick="sidebarColor(this)"
							></span>
							<span
								class="badge filter bg-gradient-dark"
								data-color="dark"
								onclick="sidebarColor(this)"
							></span>
							<span
								class="badge filter bg-gradient-info"
								data-color="info"
								onclick="sidebarColor(this)"
							></span>
							<span
								class="badge filter bg-gradient-success"
								data-color="success"
								onclick="sidebarColor(this)"
							></span>
							<span
								class="badge filter bg-gradient-warning"
								data-color="warning"
								onclick="sidebarColor(this)"
							></span>
							<span
								class="badge filter bg-gradient-danger"
								data-color="danger"
								onclick="sidebarColor(this)"
							></span>
						</div>
					</a>
					<!-- Sidenav Type -->
					<div class="mt-3">
						<h6 class="mb-0">Sidenav Type</h6>
						<p class="text-sm">Choose between 2 different sidenav types.</p>
					</div>
					<div class="d-flex">
						<button
							class="btn btn-primary w-100 px-3 mb-2 active"
							data-class="bg-transparent"
							onclick="sidebarType(this)">Transparent</button
						>
						<button
							class="btn btn-primary w-100 px-3 mb-2 ms-2"
							data-class="bg-white"
							onclick="sidebarType(this)">White</button
						>
					</div>
					<p class="text-sm d-xl-none d-block mt-2">
						You can change the sidenav type just on desktop view.
					</p>
					<!-- Navbar Fixed -->
					<div class="mt-3">
						<h6 class="mb-0">Navbar Fixed</h6>
					</div>
					<div class="form-check form-switch ps-0">
						<input
							class="form-check-input mt-1 ms-auto"
							type="checkbox"
							id="navbarFixed"
							onclick="navbarFixed(this)"
						/>
					</div>
					<hr class="horizontal dark my-sm-4" />
					<a
						class="btn bg-gradient-dark w-100"
						href="https://www.creative-tim.com/product/soft-ui-dashboard">Free Download</a
					>
					<a
						class="btn btn-outline-dark w-100"
						href="https://www.creative-tim.com/learning-lab/bootstrap/license/soft-ui-dashboard"
						>View documentation</a
					>
					<div class="w-100 text-center">
						<a
							class="github-button"
							href="https://github.com/creativetimofficial/soft-ui-dashboard"
							data-icon="octicon-star"
							data-size="large"
							data-show-count="true"
							aria-label="Star creativetimofficial/soft-ui-dashboard on GitHub">Star</a
						>
						<h6 class="mt-3">Thank you for sharing!</h6>
						<a
							href="https://twitter.com/intent/tweet?text=Check%20Soft%20UI%20Dashboard%20made%20by%20%40CreativeTim%20%23webdesign%20%23dashboard%20%23bootstrap5&amp;url=https%3A%2F%2Fwww.creative-tim.com%2Fproduct%2Fsoft-ui-dashboard"
							class="btn btn-dark mb-0 me-2"
							target="_blank"
						>
							<i class="fab fa-twitter me-1" aria-hidden="true"></i> Tweet
						</a>
						<a
							href="https://www.facebook.com/sharer/sharer.php?u=https://www.creative-tim.com/product/soft-ui-dashboard"
							class="btn btn-dark mb-0 me-2"
							target="_blank"
						>
							<i class="fab fa-facebook-square me-1" aria-hidden="true"></i> Share
						</a>
					</div>
				</div>
			</div>
		</div>
		<!--   Core JS Files   -->
		<script src="../assets/js/core/popper.min.js"></script>
		<script src="../assets/js/core/bootstrap.min.js"></script>
		<script src="../assets/js/plugins/perfect-scrollbar.min.js"></script>
		<script src="../assets/js/plugins/smooth-scrollbar.min.js"></script>
		<script>
			var win = navigator.platform.indexOf('Win') > -1;
			if (win && document.querySelector('#sidenav-scrollbar')) {
				var options = {
					damping: '0.5'
				};
				Scrollbar.init(document.querySelector('#sidenav-scrollbar'), options);
			}
		</script>
		<!-- Github buttons -->
		<script async defer src="https://buttons.github.io/buttons.js"></script>
		<!-- Control Center for Soft Dashboard: parallax effects, scripts for the example pages etc -->
		<script src="../assets/js/soft-ui-dashboard.min.js?v=1.1.0"></script>
	</body>
</html>
