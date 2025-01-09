<script>
	import { onMount } from 'svelte';
	import { getAuth, signOut, deleteUser, updateProfile, updateEmail } from 'firebase/auth';
	import { getFirestore, doc, getDoc, deleteDoc } from 'firebase/firestore';
	import { auth, db } from '$lib/firebase'; // Adjust according to your file structure
	import { goto } from '$app/navigation';

	let userPhoto = '';
	let displayName = '';
	let role = '';
	let userEmail = '';

	onMount(async () => {
		const user = auth.currentUser;

		if (user) {
			// Fetch profile details from Firebase Auth
			userPhoto = user.photoURL || 'assets/img/favicon.png';
			displayName = user.displayName || 'User';
			userEmail = user.email || 'Not available';

			// Fetch role from Firestore
			const userDoc = doc(db, 'users', user.uid);
			const docSnap = await getDoc(userDoc);
			if (docSnap.exists()) {
				role = docSnap.data().role || 'User';
			} else {
				console.log('No user role found in Firestore.');
			}
		}
	});

	onMount(() => {
		const iconNavbarSidenav = document.getElementById('iconNavbarSidenav');
		const iconSidenav = document.getElementById('iconSidenav');
		const sidenav = document.getElementById('sidenav-main');
		const innerBody = document.getElementById('inner-body');
		let className = 'g-sidenav-pinned';

		function toggleSidenav() {
			console.log('Toggling sidenav');
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

	function SignOut() {
		const auth = getAuth();
		signOut(auth)
			.then(() => {
				alert('Successfully signed out.');
				goto('/login');
			})
			.catch((error) => {
				console.log(error);
			});
	}

	async function deleteAccount() {
		const user = auth.currentUser;

		if (user) {
			try {
				// Delete the user's Firestore document
				await deleteDoc(doc(db, 'users', user.uid));

				// Delete the user's authentication account
				await deleteUser(user);

				alert('Account successfully deleted.');
				goto('/login');
			} catch (error) {
				console.error('Error deleting account:', error);
				alert('Error deleting account: ' + error.message);
			}
		} else {
			alert('No user is currently signed in.');
		}
	}

	let newName = '';

	async function changeName() {
		const user = auth.currentUser;

		if (user) {
			try {
				await updateProfile(user, { displayName: newName });
				alert('Name successfully updated.');
				displayName = newName; // Update the local variable
			} catch (error) {
				console.error('Error updating name:', error);
				alert('Error updating name: ' + error.message);
			}
		} else {
			alert('No user is currently signed in.');
		}
	}

	let newEmail = '';

	async function changeEmail() {
		const user = auth.currentUser;

		if (user) {
			try {
				await updateEmail(user, newEmail);
				alert('Email successfully updated.');
				userEmail = newEmail; // Update the local variable
			} catch (error) {
				console.error('Error updating email:', error);
				alert('Error updating email: ' + error.message);
			}
		} else {
			alert('No user is currently signed in.');
		}
	}
</script>

<head>
	<meta charset="utf-8" />
	<meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
	<link rel="apple-touch-icon" sizes="76x76" href="assets/img/apple-icon.png" />
	<link rel="icon" type="image/png" href="assets/img/favicon.png" />
	<title>Профил</title>
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
	<link id="pagestyle" href="assets/css/soft-ui-dashboard.css?v=1.1.0" rel="stylesheet" />
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
						<span class="nav-link-text ms-1">Home</span>
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
						<span class="nav-link-text ms-1">Issue</span>
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
						<span class="nav-link-text ms-1">Certificates</span>
					</a>
				</li>
				<li class="nav-item">
					<a class="nav-link active" href="/profile">
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
						<span class="nav-link-text ms-1">Profile</span>
					</a>
				</li>
			</ul>
		</div>
	</aside>
	<div class="main-content position-relative max-height-vh-100 h-100">
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
							<a class="opacity-5 text-dark" href="">Pages</a>
						</li>
						<li class="breadcrumb-item text-sm text-dark active" aria-current="page">Home</li>
					</ol>
					<h6 class="font-weight-bolder mb-0">Home</h6>
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

		<div class="container-fluid">
			<div
				class="page-header min-height-250 border-radius-lg mt-4 d-flex flex-column justify-content-end"
			>
				<span class="mask bg-primary opacity-9"></span>
				<div class="w-100 position-relative p-3">
					<div class="d-flex justify-content-between align-items-end">
						<div class="d-flex align-items-center">
							<div class="avatar avatar-xl position-relative me-3">
								<img src={userPhoto} alt="profileImg" class="w-100 border-radius-lg shadow-sm" />
							</div>
							<div>
								<h5 class="mb-1 text-white font-weight-bolder">{displayName}</h5>
								<p class="mb-0 text-white text-sm">
									{role === 'student'
										? 'Студент'
										: role === 'organization'
											? 'Организация'
											: 'Неизвестно'}
								</p>
							</div>
						</div>
						<a on:click={SignOut} class="btn btn-outline-white mb-0 btn-sm"> Излез </a>
					</div>
				</div>
			</div>
		</div>
		<div class="container-fluid py-4">
			<div class="row">
				<div class="col-12 col-xl-4">
					<div class="card h-100">
						<div class="card-header pb-0 p-3">
							<h6 class="mb-0">Platform Settings</h6>
						</div>
						<div class="card-body p-3">
							<h6 class="text-uppercase text-body text-xs font-weight-bolder">Account</h6>
							<ul class="list-group">
								<li class="list-group-item border-0 px-0">
									<div class="form-check form-switch ps-0">
										<button class="btn bg-danger text-white mb-0" on:click={deleteAccount}>
											Изтрий акаунт
										</button>
									</div>
								</li>
								<li class="list-group-item border-0 px-0">
									<div class="d-flex form-check form-switch ps-0">
										<button
											class="btn bg-primary text-white mb-0"
											data-bs-toggle="modal"
											data-bs-target="#changeName"
										>
											Смени Име
										</button>
									</div>
									<!-- Modal -->
									<div
										class="modal fade"
										id="changeName"
										tabindex="-1"
										aria-labelledby="changeNameLabel"
										aria-hidden="true"
									>
										<div class="modal-dialog">
											<div class="modal-content">
												<div class="modal-header">
													<h1 class="modal-title fs-5" id="changeNameLabel">Смяна на име</h1>
													<button
														type="button"
														class="btn-close"
														data-bs-dismiss="modal"
														aria-label="Close"
													></button>
												</div>
												<div class="modal-body">
													<input
														style=" border: 1px solid black; padding: 12px 15px; margin: 0 auto; width: 100%;"
														type="text"
														bind:value={newName}
													/>
												</div>
												<div class="modal-footer">
													<button type="button" class="btn btn-secondary" data-bs-dismiss="modal"
														>Затвори</button
													>
													<button type="button" class="btn btn-primary" on:click={changeName}
														>Смени</button
													>
												</div>
											</div>
										</div>
									</div>
								</li>
								<li class="list-group-item border-0 px-0">
									<div class="d-flex form-check form-switch ps-0">
										<!-- ADD EMAIL VERIFICATION -->
										<!-- <button
											class="btn bg-primary text-white mb-0"
											data-bs-toggle="modal"
											data-bs-target="#changeEmail"
										>
											Change Email
										</button> -->
									</div>
									<!-- Modal -->
									<div
										class="modal fade"
										id="changeEmail"
										tabindex="-1"
										aria-labelledby="changeEmailLabel"
										aria-hidden="true"
									>
										<div class="modal-dialog">
											<div class="modal-content">
												<div class="modal-header">
													<h1 class="modal-title fs-5" id="changeEmailLabel">Modal title</h1>
													<button
														type="button"
														class="btn-close"
														data-bs-dismiss="modal"
														aria-label="Close"
													></button>
												</div>
												<div class="modal-body">
													<input
														style="background-color: #eee; border: none; padding: 12px 15px; margin-left: 20px;"
														type="email"
														bind:value={newEmail}
													/>
												</div>
												<div class="modal-footer">
													<button type="button" class="btn btn-secondary" data-bs-dismiss="modal"
														>Close</button
													>
													<button type="button" class="btn btn-primary" on:click={changeEmail}
														>Save changes</button
													>
												</div>
											</div>
										</div>
									</div>
								</li>
							</ul>
							<h6 class="text-uppercase text-body text-xs font-weight-bolder mt-4">Application</h6>
							<ul class="list-group">
								<li class="list-group-item border-0 px-0">
									<div class="form-check form-switch ps-0">
										<input
											class="form-check-input ms-auto"
											type="checkbox"
											id="flexSwitchCheckDefault3"
										/>
										<label
											class="form-check-label text-body ms-3 text-truncate w-80 mb-0"
											for="flexSwitchCheckDefault3">New launches and projects</label
										>
									</div>
								</li>
							</ul>
						</div>
					</div>
				</div>
				<div class="col-12 col-xl-4">
					<div class="card h-100">
						<div class="card-header pb-0 p-3">
							<div class="row">
								<div class="col-md-8 d-flex align-items-center">
									<h6 class="mb-0">Profile Information</h6>
								</div>
								<div class="col-md-4 text-end">
									<a href="javascript:;">
										<i
											class="fas fa-user-edit text-secondary text-sm"
											data-bs-toggle="tooltip"
											data-bs-placement="top"
											title="Edit Profile"
										></i>
									</a>
								</div>
							</div>
						</div>
						<div class="card-body p-3">
							<ul class="list-group">
								<li class="list-group-item border-0 ps-0 pt-0 text-sm">
									<strong class="text-dark">Display Name:</strong> &nbsp; {displayName}
								</li>

								<li class="list-group-item border-0 ps-0 text-sm">
									<strong class="text-dark">Email:</strong> &nbsp; {userEmail}
								</li>
							</ul>
						</div>
					</div>
				</div>
				<div class="col-12 col-xl-4">
					<div class="card h-100">
						<div class="card-header pb-0 p-3">
							<h6 class="mb-0">Conversations</h6>
						</div>
						<div class="card-body p-3">
							<ul class="list-group">
								<li class="list-group-item border-0 d-flex align-items-center px-0 mb-2">
									<div class="avatar me-3">
										<img
											src="assets/img/kal-visuals-square.jpg"
											alt="kal"
											class="border-radius-lg shadow"
										/>
									</div>
									<div class="d-flex align-items-start flex-column justify-content-center">
										<h6 class="mb-0 text-sm">Sophie B.</h6>
										<p class="mb-0 text-xs">Hi! I need more information..</p>
									</div>
									<a class="btn btn-link pe-3 ps-0 mb-0 ms-auto" href="javascript:;">Reply</a>
								</li>
								<li class="list-group-item border-0 d-flex align-items-center px-0 mb-2">
									<div class="avatar me-3">
										<img src="assets/img/marie.jpg" alt="kal" class="border-radius-lg shadow" />
									</div>
									<div class="d-flex align-items-start flex-column justify-content-center">
										<h6 class="mb-0 text-sm">Anne Marie</h6>
										<p class="mb-0 text-xs">Awesome work, can you..</p>
									</div>
									<a class="btn btn-link pe-3 ps-0 mb-0 ms-auto" href="javascript:;">Reply</a>
								</li>
								<li class="list-group-item border-0 d-flex align-items-center px-0 mb-2">
									<div class="avatar me-3">
										<img
											src="assets/img/ivana-square.jpg"
											alt="kal"
											class="border-radius-lg shadow"
										/>
									</div>
									<div class="d-flex align-items-start flex-column justify-content-center">
										<h6 class="mb-0 text-sm">Ivanna</h6>
										<p class="mb-0 text-xs">About files I can..</p>
									</div>
									<a class="btn btn-link pe-3 ps-0 mb-0 ms-auto" href="javascript:;">Reply</a>
								</li>
								<li class="list-group-item border-0 d-flex align-items-center px-0 mb-2">
									<div class="avatar me-3">
										<img src="assets/img/team-4.jpg" alt="kal" class="border-radius-lg shadow" />
									</div>
									<div class="d-flex align-items-start flex-column justify-content-center">
										<h6 class="mb-0 text-sm">Peterson</h6>
										<p class="mb-0 text-xs">Have a great afternoon..</p>
									</div>
									<a class="btn btn-link pe-3 ps-0 mb-0 ms-auto" href="javascript:;">Reply</a>
								</li>
								<li class="list-group-item border-0 d-flex align-items-center px-0">
									<div class="avatar me-3">
										<img src="assets/img/team-3.jpg" alt="kal" class="border-radius-lg shadow" />
									</div>
									<div class="d-flex align-items-start flex-column justify-content-center">
										<h6 class="mb-0 text-sm">Nick Daniel</h6>
										<p class="mb-0 text-xs">Hi! I need more information..</p>
									</div>
									<a class="btn btn-link pe-3 ps-0 mb-0 ms-auto" href="javascript:;">Reply</a>
								</li>
							</ul>
						</div>
					</div>
				</div>
				<!-- <div class="col-12 mt-4">
					<div class="card mb-4">
						<div class="card-header pb-0 p-3">
							<h6 class="mb-1">Projects</h6>
							<p class="text-sm">Architects design houses</p>
						</div>
						<div class="card-body p-3">
							<div class="row">
								<div class="col-xl-3 col-md-6 mb-xl-0 mb-4">
									<div class="card card-blog card-plain">
										<div class="position-relative">
											<a class="d-block">
												<img
													src="assets/img/home-decor-1.jpg"
													alt="img-blur-shadow"
													class="img-fluid shadow border-radius-md"
												/>
											</a>
										</div>
										<div class="card-body px-1 pb-0">
											<p class="text-secondary mb-0 text-sm">Project #2</p>
											<a href="javascript:;">
												<h5 class="font-weight-bolder">Modern</h5>
											</a>
											<p class="mb-4 text-sm">
												As Uber works through a huge amount of internal management turmoil.
											</p>
											<div class="d-flex align-items-center justify-content-between">
												<button type="button" class="btn btn-outline-primary btn-sm mb-0"
													>View Project</button
												>
												<div class="avatar-group mt-2">
													<a
														href="javascript:;"
														class="avatar avatar-xs rounded-circle"
														data-bs-toggle="tooltip"
														data-bs-placement="bottom"
														title="Elena Morison"
													>
														<img alt="Image placeholder" src="assets/img/team-1.jpg" />
													</a>
													<a
														href="javascript:;"
														class="avatar avatar-xs rounded-circle"
														data-bs-toggle="tooltip"
														data-bs-placement="bottom"
														title="Ryan Milly"
													>
														<img alt="Image placeholder" src="assets/img/team-2.jpg" />
													</a>
													<a
														href="javascript:;"
														class="avatar avatar-xs rounded-circle"
														data-bs-toggle="tooltip"
														data-bs-placement="bottom"
														title="Nick Daniel"
													>
														<img alt="Image placeholder" src="assets/img/team-3.jpg" />
													</a>
													<a
														href="javascript:;"
														class="avatar avatar-xs rounded-circle"
														data-bs-toggle="tooltip"
														data-bs-placement="bottom"
														title="Peterson"
													>
														<img alt="Image placeholder" src="assets/img/team-4.jpg" />
													</a>
												</div>
											</div>
										</div>
									</div>
								</div>
								<div class="col-xl-3 col-md-6 mb-xl-0 mb-4">
									<div class="card card-blog card-plain">
										<div class="position-relative">
											<a class="d-block">
												<img
													src="assets/img/home-decor-2.jpg"
													alt="img-blur-shadow"
													class="img-fluid shadow border-radius-md"
												/>
											</a>
										</div>
										<div class="card-body px-1 pb-0">
											<p class="text-secondary mb-0 text-sm">Project #1</p>
											<a href="javascript:;">
												<h5 class="font-weight-bolder">Scandinavian</h5>
											</a>
											<p class="mb-4 text-sm">
												Music is something that every person has his or her own specific opinion.
											</p>
											<div class="d-flex align-items-center justify-content-between">
												<button type="button" class="btn btn-outline-primary btn-sm mb-0"
													>View Project</button
												>
												<div class="avatar-group mt-2">
													<a
														href="javascript:;"
														class="avatar avatar-xs rounded-circle"
														data-bs-toggle="tooltip"
														data-bs-placement="bottom"
														title="Nick Daniel"
													>
														<img alt="Image placeholder" src="assets/img/team-3.jpg" />
													</a>
													<a
														href="javascript:;"
														class="avatar avatar-xs rounded-circle"
														data-bs-toggle="tooltip"
														data-bs-placement="bottom"
														title="Peterson"
													>
														<img alt="Image placeholder" src="assets/img/team-4.jpg" />
													</a>
													<a
														href="javascript:;"
														class="avatar avatar-xs rounded-circle"
														data-bs-toggle="tooltip"
														data-bs-placement="bottom"
														title="Elena Morison"
													>
														<img alt="Image placeholder" src="assets/img/team-1.jpg" />
													</a>
													<a
														href="javascript:;"
														class="avatar avatar-xs rounded-circle"
														data-bs-toggle="tooltip"
														data-bs-placement="bottom"
														title="Ryan Milly"
													>
														<img alt="Image placeholder" src="assets/img/team-2.jpg" />
													</a>
												</div>
											</div>
										</div>
									</div>
								</div>
								<div class="col-xl-3 col-md-6 mb-xl-0 mb-4">
									<div class="card card-blog card-plain">
										<div class="position-relative">
											<a class="d-block">
												<img
													src="assets/img/home-decor-3.jpg"
													alt="img-blur-shadow"
													class="img-fluid shadow border-radius-md"
												/>
											</a>
										</div>
										<div class="card-body px-1 pb-0">
											<p class="text-secondary mb-0 text-sm">Project #3</p>
											<a href="javascript:;">
												<h5 class="font-weight-bolder">Minimalist</h5>
											</a>
											<p class="mb-4 text-sm">
												Different people have different taste, and various types of music.
											</p>
											<div class="d-flex align-items-center justify-content-between">
												<button type="button" class="btn btn-outline-primary btn-sm mb-0"
													>View Project</button
												>
												<div class="avatar-group mt-2">
													<a
														href="javascript:;"
														class="avatar avatar-xs rounded-circle"
														data-bs-toggle="tooltip"
														data-bs-placement="bottom"
														title="Peterson"
													>
														<img alt="Image placeholder" src="assets/img/team-4.jpg" />
													</a>
													<a
														href="javascript:;"
														class="avatar avatar-xs rounded-circle"
														data-bs-toggle="tooltip"
														data-bs-placement="bottom"
														title="Nick Daniel"
													>
														<img alt="Image placeholder" src="assets/img/team-3.jpg" />
													</a>
													<a
														href="javascript:;"
														class="avatar avatar-xs rounded-circle"
														data-bs-toggle="tooltip"
														data-bs-placement="bottom"
														title="Ryan Milly"
													>
														<img alt="Image placeholder" src="assets/img/team-2.jpg" />
													</a>
													<a
														href="javascript:;"
														class="avatar avatar-xs rounded-circle"
														data-bs-toggle="tooltip"
														data-bs-placement="bottom"
														title="Elena Morison"
													>
														<img alt="Image placeholder" src="assets/img/team-1.jpg" />
													</a>
												</div>
											</div>
										</div>
									</div>
								</div>
								<div class="col-xl-3 col-md-6 mb-xl-0 mb-4">
									<div class="card h-100 card-plain border">
										<div class="card-body d-flex flex-column justify-content-center text-center">
											<a href="javascript:;">
												<i class="fa fa-plus text-secondary mb-3"></i>
												<h5 class=" text-secondary">New project</h5>
											</a>
										</div>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div> 
			</div>-->
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
		</div>

		<!-- Control Center for Soft Dashboard: parallax effects, scripts for the example pages etc -->
		<script src="assets/js/soft-ui-dashboard.min.js"></script>

		<!--   Core JS Files   -->
		<script src="assets/js/core/popper.min.js"></script>
		<script src="assets/js/core/bootstrap.min.js"></script>
		<script src="assets/js/plugins/perfect-scrollbar.min.js"></script>
		<script src="assets/js/plugins/smooth-scrollbar.min.js"></script>

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
	</div></body
>
