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

	onMount(async () => {
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

	import { contract } from '$lib/eth';
	import { ethers } from 'ethers';
	import QRCode from 'qrcode';
	import { PDFDocument, rgb } from 'pdf-lib'; // Import pdf-lib
	import { rtdb } from '$lib/firebase';
	import { ref, set } from 'firebase/database';
	import { auth } from '$lib/firebase';

	let courseName = '';
	let studentName = ''; // Add studentName
	let studentAddress = '';
	let dateIssued = '';
	let user = null;
	let certificateStatus = ''; // This will store the status message
	let certificateStatusMessage = ''; // This will hold the actual status text
	let showStatus = false; // A flag to control the visibility of the status

	auth.onAuthStateChanged((firebaseUser) => {
		user = firebaseUser;
		if (user) {
			loadBlanks(); // Load blanks when the user logs in
			loadCertificates();
		}
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

	// Function to sign certificate details
	async function signCertificate(studentAddress, courseName, studentName, email, dateIssued) {
		if (!user) {
			throw new Error('Signer not available');
		}

		// Hash the certificate details
		const certificateHash = ethers.utils.solidityKeccak256(
			['address', 'string', 'string', 'string', 'string'],
			[studentAddress, courseName, studentName, email, dateIssued]
		);

		// Sign the hash
		const signature = await contract.signer.signMessage(ethers.utils.arrayify(certificateHash));
		return signature;
	}

	let drawingUrl;
	async function generateCertificatePDF(
		studentAddress,
		courseName,
		studentName,
		email,
		dateIssued
	) {
		// Зареждане на оригиналния PDF
		const existingPdfBytes = await fetch('proba.pdf').then((res) => res.arrayBuffer());
		const pdfDoc = await PDFDocument.load(existingPdfBytes);

		// Вземи първата страница
		const page = pdfDoc.getPage(0);

		// Координати за замяна на текста
		const replacements = [
			{ text: courseName, x: 320, y: 400, size: 58 },
			{ text: studentName, x: 330, y: 290, size: 24 },
			{ text: studentAddress, x: 240, y: 230, size: 12 },
			{ text: dateIssued, x: 500, y: 150, size: 12 }
		];

		// Добави новия текст
		for (const { text, x, y, size } of replacements) {
			page.drawText(text, {
				x,
				y,
				size,
				color: rgb(0, 0, 0)
			});
		}

		// Конвертиране на рисунката от канвас в base64 PNG
		drawingUrl = canvas.toDataURL('image/png');

		// Вмъкване на рисунката в PDF
		const drawingImage = await pdfDoc.embedPng(drawingUrl);

		// Постави рисунката в PDF на зададената позиция
		// Променени са координатите и размерите на изображението, за да не е сплескано
		page.drawImage(drawingImage, {
			x: 120, // Позиция по x
			y: 130, // Позиция по y
			width: 200, // Ширина на изображението
			height: 120 // Височина на изображението, коригирана, за да изглежда правилно
		});

		// Генерирай QR код
		const qrCodeUrl = `http://localhost:5173/verificiraj?address=${studentAddress}`;
		const qrCodeDataUrl = await QRCode.toDataURL(qrCodeUrl);
		const qrImage = await pdfDoc.embedPng(qrCodeDataUrl);

		// Постави QR кода в PDF
		page.drawImage(qrImage, {
			x: 50,
			y: 50,
			width: 100,
			height: 100
		});

		// Запази PDF файла
		const pdfBytes = await pdfDoc.save();

		// Изтегли обновения PDF
		const blob = new Blob([pdfBytes], { type: 'application/pdf' });
		const link = document.createElement('a');
		link.href = URL.createObjectURL(blob);
		link.download = 'updated_certificate.pdf';
		link.click();
	}

	import { provider, signer } from '$lib/eth'; // Ensure 'contract' is also imported from your eth library

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
			// Get the issuer's Ethereum address (the logged-in user's address)
			const issuerAddress = await signer.getAddress(); // Ensure signer is available

			// Set the certificate status to pending
			certificateStatus = 'pending';
			certificateStatusMessage = 'Certificate issuance in progress...';
			showStatus = true;
			await saveCertificateStatusToDB(studentAddress, certificateStatus);

			// Assuming signCertificate function is available and works as expected
			const signature = await signCertificate(
				studentAddress,
				courseName,
				studentName,
				user.email,
				dateIssued
			);

			// Issue the certificate through the contract
			const tx = await contract.issueCertificate(
				studentAddress,
				courseName,
				studentName,
				user.email,
				dateIssued,
				signature,
				{ gasLimit: 1000000 }
			);

			await tx.wait(); // Wait for the transaction to confirm

			// Once transaction is confirmed, update the status to issued
			certificateStatus = 'completed';
			certificateStatusMessage = 'Certificate issued successfully!';
			await saveCertificateStatusToDB(studentAddress, certificateStatus);

			// Hide status after 5 seconds
			setTimeout(() => {
				showStatus = false;
			}, 5000);

			alert('Certificate issued successfully');

			// Save the issued certificate details along with the issuer's Ethereum address
			await saveIssuedCertificate(courseName, studentName, dateIssued, signature);

			// Generate the certificate PDF
			await generateCertificatePDF(studentAddress, courseName, studentName, user.email, dateIssued);

			// Update issued certificates count for the user
			incrementIssuedCertificates(user.uid); // This might be updated to use Ethereum address, not user.uid

			// Clear the form inputs
			courseName = '';
			studentName = '';
			studentAddress = '';
			dateIssued = '';
		} catch (err) {
			console.error('Error issuing certificate:', err);
			alert('Failed to issue certificate');
			certificateStatus = 'failed'; // In case of failure, mark as failed
			certificateStatusMessage = 'Failed to issue certificate.';
			showStatus = true;
			await saveCertificateStatusToDB(studentAddress, certificateStatus);
		}
	}

	import { increment, setDoc, doc, collection } from 'firebase/firestore';
	import { getFirestore } from '$lib/firebase'; // Adjust this according to your setup
	const db = getFirestore();
	// Function to increment the issued certificates count for a specific user
	async function incrementIssuedCertificates(userUid) {
		try {
			const userRef = doc(collection(db, 'users'), userUid);
			const certificatesRef = collection(userRef, 'certificates');

			// Document to track the count of issued certificates
			const trackerDoc = doc(certificatesRef, 'tracker');

			await setDoc(trackerDoc, { issuedCertificates: increment(1) }, { merge: true });
		} catch (error) {
			console.error('Error incrementing issued certificates count:', error);
		}
	}

	async function saveCertificateStatusToDB(studentAddress, status) {
		const statusRef = ref(rtdb, `certificates/${studentAddress}/status`);
		await set(statusRef, status);
		console.log(`Certificate status for ${studentAddress} saved: ${status}`);
	}

	import { get } from 'firebase/database';

	let blanks = [];

	// Save Blank Function
	async function saveBlank() {
		if (!courseName || !studentName || !studentAddress || !dateIssued) {
			alert('Моля, попълнете всички полета.');
			return;
		}

		if (blanks.length >= 3) {
			alert('Можете да запазите максимум 3 чернови.');
			return;
		}

		const newBlank = { courseName, studentName, studentAddress, dateIssued };

		blanks = [...blanks, newBlank];

		// Save the blank to Firebase under the user's ID
		const blanksRef = ref(rtdb, `blanks/${user.uid}`);
		await set(blanksRef, blanks);

		// Clear form fields
		courseName = '';
		studentName = '';
		studentAddress = '';
		dateIssued = '';
	}

	// Load Blanks Function
	async function loadBlanks() {
		const blanksRef = ref(rtdb, `blanks/${user.uid}`);
		const snapshot = await get(blanksRef);
		if (snapshot.exists()) {
			blanks = snapshot.val();
		} else {
			blanks = [];
		}
	}

	// Continue Blank Function
	function loadBlank(index) {
		const blank = blanks[index];
		courseName = blank.courseName;
		studentName = blank.studentName;
		studentAddress = blank.studentAddress;
		dateIssued = blank.dateIssued;

		// Optionally remove the blank after loading it
		blanks = blanks.filter((_, i) => i !== index);

		// Update the database with the new blanks state
		const blanksRef = ref(rtdb, `blanks/${user.uid}`);
		set(blanksRef, blanks);
	}

	// Delete Blank Function
	async function deleteBlank(index) {
		blanks = blanks.filter((_, i) => i !== index);

		// Update the database after deletion
		const blanksRef = ref(rtdb, `blanks/${user.uid}`);
		set(blanksRef, blanks);
	}

	import { query, orderBy, limit, getDocs } from 'firebase/firestore';

	import { serverTimestamp, deleteDoc } from 'firebase/firestore';

	async function saveIssuedCertificate(courseName, studentName, dateIssued, signature) {
		if (!user) return;

		const userRef = doc(collection(db, 'users'), user.uid);
		const certificatesRef = collection(userRef, 'certificates');

		// Create a document with a unique ID
		const newCertificateRef = doc(certificatesRef);

		// Set the data, including the current timestamp
		await setDoc(newCertificateRef, {
			courseName,
			studentName,
			dateIssued,
			createdAt: serverTimestamp(),
			drawingUrl,
			signature
		});

		// Retrieve all certificates ordered by createdAt
		const q = query(certificatesRef, orderBy('createdAt', 'desc'));
		const snapshot = await getDocs(q);

		// Update the certificates list to include only the six most recent
		certificates = snapshot.docs.slice(0, 6).map((doc) => doc.data());
	}

	let certificates = [];

	async function loadCertificates() {
		const userRef = doc(collection(db, 'users'), user.uid);
		const certificatesRef = collection(userRef, 'certificates');

		// Query to order by the newly added createdAt field
		const q = query(certificatesRef, orderBy('createdAt', 'desc'), limit(6));
		const snapshot = await getDocs(q);
		certificates = snapshot.docs.map((doc) => doc.data());
	}

	let canvas, ctx;
	let isPainting = false;
	let lineWidth = 5;

	onMount(() => {
		canvas = document.getElementById('drawing-board');
		ctx = canvas.getContext('2d');

		// Задаване на размерите на canvas
		canvas.width = 200;
		canvas.height = 200;
	});

	const draw = (e) => {
		if (!isPainting) return;

		const rect = canvas.getBoundingClientRect();
		const x = e.clientX - rect.left;
		const y = e.clientY - rect.top;

		ctx.lineWidth = lineWidth;
		ctx.lineCap = 'round';
		ctx.lineTo(x, y);
		ctx.stroke();
	};

	const startDrawing = () => {
		isPainting = true;
	};

	const stopDrawing = () => {
		isPainting = false;
		ctx.beginPath();
	};

	const clearCanvas = () => {
		ctx.clearRect(0, 0, canvas.width, canvas.height);
	};

	const saveCanvas = () => {
		const dataURL = canvas.toDataURL('image/png');
		const link = document.createElement('a');
		link.href = dataURL;
		link.download = 'drawing.png';
		link.click();
	};
</script>

<html lang="en">
	<head>
		<meta charset="utf-8" />
		<meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
		<link rel="apple-touch-icon" sizes="76x76" href="../assets/img/apple-icon.png" />
		<link rel="icon" type="image/png" href="../assets/img/favicon.png" />
		<title>Издай</title>
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
						<a class="nav-link active" href="/izdaj">
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
						<a class="nav-link" href="/verificiraj">
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
							<li class="breadcrumb-item text-sm text-dark active" aria-current="page">Издай</li>
						</ol>
						<h6 class="font-weight-bolder mb-0">Издай</h6>
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
			<div class="container-fluid py-4">
				<div class="row">
					<div class="col-lg-8">
						<div class="row">
							<div class="col-md-12 mb-lg-0 mb-4">
								<div class="card mt-4">
									<div class="card-header pb-0 p-3">
										<div class="row">
											<div class="col-6 d-flex align-items-center">
												<h6 class="mb-0">Нов сертификат</h6>
											</div>
											<div class="col-6 text-end">
												<button on:click={saveBlank} class="btn bg-gradient-dark mb-0">
													<i class="fas fa-save"></i>&nbsp;&nbsp;Запази
												</button>
												<button on:click={issueCertificate} class="btn bg-gradient-dark mb-0">
													<i class="fas fa-plus"></i>&nbsp;&nbsp;Издай
												</button>
											</div>
										</div>
									</div>
									<div class="card-body p-3">
										<div class="row">
											<div class="col-md-6 mb-md-0 mb-4">
												<input
													class="card card-body border card-plain border-radius-lg d-flex align-items-center flex-row"
													type="text"
													bind:value={courseName}
													placeholder="Име на курса"
												/>
											</div>
											<div class="col-md-6">
												<div class="col-md-6 mb-md-0 mb-4">
													<input
														class="card card-body border card-plain border-radius-lg d-flex align-items-center flex-row"
														type="text"
														bind:value={studentName}
														placeholder="Име на студента"
													/>
												</div>
											</div>
											<div class="col-md-6 mt-3">
												<div class="col-md-6 mb-md-0 mb-4">
													<input
														class="card card-body border card-plain border-radius-lg d-flex align-items-center flex-row"
														type="text"
														bind:value={studentAddress}
														placeholder="Адрес на студента (Eth)"
													/>
												</div>
											</div>
											<div class="col-md-6 mt-3">
												<div class="col-md-6 mb-md-0 mb-4">
													<input
														class="card card-body border card-plain border-radius-lg d-flex align-items-center flex-row"
														type="text"
														bind:value={dateIssued}
														placeholder="Дата (ГГГГ-ММ-ДД)"
													/>
												</div>
											</div>
										</div>
									</div>
								</div>
							</div>
							<div class="col-md-12 mt-4">
								<div class="card">
									<div class="card-header">
										<h6 class="mb-0">Запазени чернови</h6>
									</div>
									<div class="card-body pt-4 p-3">
										<ul class="list-group">
											{#each blanks as blank, index}
												<li
													class="list-group-item border-0 d-flex p-4 mb-2 bg-gray-100 border-radius-lg"
												>
													<div class="d-flex flex-column">
														<h4 class="mb-3">{blank.courseName}</h4>
														<strong>{blank.studentName}</strong>
													</div>
													<div class="ms-auto text-end">
														<a
															class="btn btn-link text-danger text-gradient px-3 mb-0"
															on:click={() => deleteBlank(index)}
															><i class="far fa-trash-alt me-2"></i>Изтрий</a
														>
														<a
															class="btn btn-link text-dark px-3 mb-0"
															on:click={() => loadBlank(index)}
															><i class="fas fa-pencil-alt text-dark me-2" aria-hidden="true"
															></i>Избери</a
														>
													</div>
												</li>
											{/each}
											{#if blanks.length === 0}
												<p>Няма запазени чернови.</p>
											{/if}
										</ul>
									</div>
								</div>
							</div>
						</div>
					</div>
					<div class="col-lg-4 col-md-6">
						<div class="card h-100">
							<div class="card-header pb-0">
								<h6>Последно издадени сертификати</h6>
								<div class="card-body p-3">
									<div class="timeline timeline-one-side">
										{#each certificates as certificate, index}
											<div class="timeline-block mb-3">
												<span class="timeline-step">⚫</span>

												<div class="timeline-content">
													<h6 class="text-dark text-sm font-weight-bold mb-0">
														{certificate.courseName}, {certificate.studentName}
													</h6>
													<p class="text-secondary font-weight-bold text-xs mt-1 mb-0">
														{certificate.dateIssued}
													</p>
												</div>
											</div>
										{/each}

										{#if certificates.length === 0}
											<p>Няма издадени сертификати.</p>
										{/if}
									</div>
								</div>
							</div>
						</div>
					</div>
					<div class="container">
						<div id="toolbar">
							<button on:click={clearCanvas}>Clear</button>
							<button on:click={saveCanvas}>Save</button>
						</div>
						<div class="drawing-board">
							<canvas
								id="drawing-board"
								on:mousedown={startDrawing}
								on:mouseup={stopDrawing}
								on:mousemove={draw}
							></canvas>
						</div>
					</div>
				</div>
				<div class="row">
					<div class="col-md-5 mt-4">
						<div class="card h-100 mb-4">
							<div class="card-header pb-0 px-3">
								<div class="row">
									<div class="col-md-6">
										<h6 class="mb-0">Your Transaction's</h6>
									</div>
									<div class="col-md-6 d-flex justify-content-end align-items-center">
										<i class="far fa-calendar-alt me-2"></i>
										<small>23 - 30 March 2020</small>
									</div>
								</div>
							</div>
							<div class="card-body pt-4 p-3">
								<h6 class="text-uppercase text-body text-xs font-weight-bolder mb-3">Newest</h6>
								<ul class="list-group">
									<li
										class="list-group-item border-0 d-flex justify-content-between ps-0 mb-2 border-radius-lg"
									>
										<div class="d-flex align-items-center">
											<button
												class="btn btn-icon-only btn-rounded btn-outline-danger mb-0 me-3 btn-sm d-flex align-items-center justify-content-center"
												><i class="fas fa-arrow-down"></i></button
											>
											<div class="d-flex flex-column">
												<h6 class="mb-1 text-dark text-sm">Netflix</h6>
												<span class="text-xs">27 March 2020, at 12:30 PM</span>
											</div>
										</div>
										<div
											class="d-flex align-items-center text-danger text-gradient text-sm font-weight-bold"
										>
											- $ 2,500
										</div>
									</li>
									<li
										class="list-group-item border-0 d-flex justify-content-between ps-0 mb-2 border-radius-lg"
									>
										<div class="d-flex align-items-center">
											<button
												class="btn btn-icon-only btn-rounded btn-outline-success mb-0 me-3 btn-sm d-flex align-items-center justify-content-center"
												><i class="fas fa-arrow-up"></i></button
											>
											<div class="d-flex flex-column">
												<h6 class="mb-1 text-dark text-sm">Apple</h6>
												<span class="text-xs">27 March 2020, at 04:30 AM</span>
											</div>
										</div>
										<div
											class="d-flex align-items-center text-success text-gradient text-sm font-weight-bold"
										>
											+ $ 2,000
										</div>
									</li>
								</ul>
								<h6 class="text-uppercase text-body text-xs font-weight-bolder my-3">Yesterday</h6>
								<ul class="list-group">
									<li
										class="list-group-item border-0 d-flex justify-content-between ps-0 mb-2 border-radius-lg"
									>
										<div class="d-flex align-items-center">
											<button
												class="btn btn-icon-only btn-rounded btn-outline-success mb-0 me-3 btn-sm d-flex align-items-center justify-content-center"
												><i class="fas fa-arrow-up"></i></button
											>
											<div class="d-flex flex-column">
												<h6 class="mb-1 text-dark text-sm">Stripe</h6>
												<span class="text-xs">26 March 2020, at 13:45 PM</span>
											</div>
										</div>
										<div
											class="d-flex align-items-center text-success text-gradient text-sm font-weight-bold"
										>
											+ $ 750
										</div>
									</li>
									<li
										class="list-group-item border-0 d-flex justify-content-between ps-0 mb-2 border-radius-lg"
									>
										<div class="d-flex align-items-center">
											<button
												class="btn btn-icon-only btn-rounded btn-outline-success mb-0 me-3 btn-sm d-flex align-items-center justify-content-center"
												><i class="fas fa-arrow-up"></i></button
											>
											<div class="d-flex flex-column">
												<h6 class="mb-1 text-dark text-sm">HubSpot</h6>
												<span class="text-xs">26 March 2020, at 12:30 PM</span>
											</div>
										</div>
										<div
											class="d-flex align-items-center text-success text-gradient text-sm font-weight-bold"
										>
											+ $ 1,000
										</div>
									</li>
									<li
										class="list-group-item border-0 d-flex justify-content-between ps-0 mb-2 border-radius-lg"
									>
										<div class="d-flex align-items-center">
											<button
												class="btn btn-icon-only btn-rounded btn-outline-success mb-0 me-3 btn-sm d-flex align-items-center justify-content-center"
												><i class="fas fa-arrow-up"></i></button
											>
											<div class="d-flex flex-column">
												<h6 class="mb-1 text-dark text-sm">Creative Tim</h6>
												<span class="text-xs">26 March 2020, at 08:30 AM</span>
											</div>
										</div>
										<div
											class="d-flex align-items-center text-success text-gradient text-sm font-weight-bold"
										>
											+ $ 2,500
										</div>
									</li>
									<li
										class="list-group-item border-0 d-flex justify-content-between ps-0 mb-2 border-radius-lg"
									>
										<div class="d-flex align-items-center">
											<button
												class="btn btn-icon-only btn-rounded btn-outline-dark mb-0 me-3 btn-sm d-flex align-items-center justify-content-center"
												><i class="fas fa-exclamation"></i></button
											>
											<div class="d-flex flex-column">
												<h6 class="mb-1 text-dark text-sm">Webflow</h6>
												<span class="text-xs">26 March 2020, at 05:00 AM</span>
											</div>
										</div>
										<div class="d-flex align-items-center text-dark text-sm font-weight-bold">
											Pending
										</div>
									</li>
								</ul>
							</div>
						</div>
					</div>
				</div>
				<footer class="footer pt-3">
					<div class="container-fluid">
						<div class="row align-items-center justify-content-lg-between">
							<div class="col-lg-6">
								<ul class="nav nav-footer justify-content-center justify-content-lg-end">
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
