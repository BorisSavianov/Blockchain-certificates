<script>
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { auth, db } from '$lib/firebase';
	import {
		collection,
		getDocs,
		getDoc,
		addDoc,
		updateDoc,
		doc,
		setDoc,
		deleteDoc
	} from 'firebase/firestore';

	let organizations = [];
	let selectedOrg;
	let newOrgName = '';
	let organizationDetails = null;
	let membershipRequests = [];
	let role;
	onMount(async () => {
		const user = auth.currentUser;
		if (user) {
			const userDoc = await getDoc(doc(db, 'users', user.uid));
			if (userDoc.exists()) {
				selectedOrg = userDoc.data().selectedOrg || null;
			}
			if (selectedOrg) {
				await fetchOrganization(selectedOrg);
			} else {
				await loadOrganizations();
			}
		} else {
			goto('/login');
		}
	});

	onMount(async () => {
		const user = auth.currentUser;
		if (user) {
			// Fetch role and selected organization from Firestore
			const userDoc = doc(db, 'users', user.uid);
			const docSnap = await getDoc(userDoc);
			if (docSnap.exists()) {
				const userData = docSnap.data();
				role = userData.role || 'User';
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

	async function loadOrganizations() {
		const orgsSnapshot = await getDocs(collection(db, 'organizations'));
		organizations = orgsSnapshot.docs.map((doc) => ({
			id: doc.id,
			...doc.data()
		}));
	}

	async function selectOrganization(orgId) {
		const user = auth.currentUser;
		if (user) {
			// Check if the user is the owner of the organization
			const orgDoc = await getDoc(doc(db, 'organizations', orgId));
			if (orgDoc.exists()) {
				const orgData = orgDoc.data();
				if (orgData.createdBy === user.uid) {
					// Automatically add the owner to the members list
					await setDoc(doc(db, 'organizations', orgId, 'members', user.uid), {
						uid: user.uid
					});
					await updateDoc(doc(db, 'users', user.uid), { selectedOrg: orgId });
					alert('Влязохте в организацията.');
					return;
				}
			}

			// If not the owner, send a join request
			await setDoc(doc(db, 'organizations', orgId, 'requests', user.uid), {
				uid: user.uid
			});
			alert('Изпратеана е заявка. Изчакайте за потвърждение.');
		}
	}

	async function fetchOrganization(orgId) {
		const orgDoc = await getDoc(doc(db, 'organizations', orgId));
		if (orgDoc.exists()) {
			organizationDetails = {
				id: orgDoc.id,
				...orgDoc.data()
			};
			await loadMembershipRequests(orgId);
		} else {
			organizationDetails = null;
		}
	}

	async function loadMembershipRequests(orgId) {
		const requestsSnapshot = await getDocs(collection(db, 'organizations', orgId, 'requests'));
		membershipRequests = requestsSnapshot.docs.map((doc) => ({
			id: doc.id,
			...doc.data()
		}));
	}

	async function approveMember(orgId, userId) {
		await setDoc(doc(db, 'organizations', orgId, 'members', userId), { uid: userId });
		await updateDoc(doc(db, 'users', userId), { selectedOrg: orgId });
		await deleteDoc(doc(db, 'organizations', orgId, 'requests', userId));
		await loadMembershipRequests(orgId);
	}

	async function denyRequest(orgId, userId) {
		await deleteDoc(doc(db, 'organizations', orgId, 'requests', userId));
		await loadMembershipRequests(orgId);
	}

	async function removeMember(orgId, userId) {
		await deleteDoc(doc(db, 'organizations', orgId, 'members', userId));
		await updateDoc(doc(db, 'users', userId), { selectedOrg: null });
	}

	async function deleteOrganization(orgId) {
		const user = auth.currentUser;
		if (user) {
			const orgDoc = organizations.find((org) => org.id === orgId);
			if (orgDoc && orgDoc.createdBy === user.uid) {
				await deleteDoc(doc(db, 'organizations', orgId));
				await loadOrganizations();
			}
		}
	}
</script>

<head>
	<meta charset="utf-8" />
	<meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
	<link rel="apple-touch-icon" sizes="76x76" href="assets/img/apple-icon.png" />
	<link rel="icon" type="image/png" href="assets/img/favicon.png" />
	<title>Организации</title>
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
							<a class="opacity-5 text-dark" href="">Страници</a>
						</li>
						<li class="breadcrumb-item text-sm text-dark active" aria-current="page">
							Организации
						</li>
					</ol>
					<h6 class="font-weight-bolder mb-0">Организации</h6>
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
		{#if selectedOrg}
			{#if organizationDetails}
				<div class="container-fluid">
					<div
						class="page-header min-height-250 border-radius-lg mt-4 d-flex flex-column justify-content-end"
					>
						<span class="mask bg-primary opacity-9"></span>
						<div class="w-100 position-relative p-3">
							<div class="d-flex justify-content-between align-items-end">
								<div class="d-flex align-items-center">
									<div class="avatar avatar-xl position-relative me-3">
										<img alt="profileImg" class="w-100 border-radius-lg shadow-sm" />
									</div>
									<div>
										<h4 class="mb-1 text-white font-weight-bolder">{organizationDetails.name}</h4>
										<p class="text-white">ID: {organizationDetails.id}</p>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
				<div class="container-fluid py-4">
					<div class="row">
						{#if organizationDetails.createdBy === auth.currentUser?.uid}
							<div class="col-12 col-xl-6 mb-5">
								<div class="card h-100">
									<div class="card-header pb-0 p-3">
										<h6 class="mb-0">Заявки за вход</h6>
									</div>
									<div class="card-body p-3">
										<ul class="list-group">
											{#each membershipRequests as request}
												<li class="list-group-item border-0 px-0">
													User ID: {request.uid}
													<button
														class="btn bg-primary text-white mb-0"
														on:click={() => approveMember(selectedOrg, request.uid)}>Approve</button
													>
													<button
														class="btn bg-primary text-white mb-0"
														on:click={() => denyRequest(selectedOrg, request.uid)}>Deny</button
													>
												</li>
											{/each}
											{#if membershipRequests.length === 0}
												Няма заявки
											{/if}
										</ul>
									</div>
								</div>
							</div>
						{/if}
						<div class="col-12 col-xl-6 mb-5">
							<div class="card h-100">
								<div class="card-header pb-0 p-3">
									<h6 class="mb-0">Допълнителни настройки</h6>
								</div>
								<div class="card-body p-3">
									<ul class="list-group">
										<a
											class="btn btn-primary mb-0 btn-sm"
											on:click={() => removeMember(selectedOrg, auth.currentUser?.uid)}
										>
											Излез от организация
										</a>
									</ul>
								</div>
							</div>
						</div>
					</div>
				</div>
			{/if}
		{:else}
			<!-- gggggggggsagddsg -->
			<div class="container-fluid">
				<div
					class="page-header min-height-250 border-radius-lg mt-4 d-flex flex-column justify-content-end"
				>
					<span class="mask bg-primary opacity-9"></span>
					<div class="w-100 position-relative p-3">
						<div class="d-flex justify-content-between align-items-end">
							<div class="d-flex align-items-center">
								<div>
									<h3 class="text-white">Избери организация</h3>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
			<div class="container-fluid py-4">
				<div class="row">
					<div class="col-12 col-xl-6 mb-5">
						{#if organizations.length}
							<div class="card h-100">
								<div class="card-header pb-0 p-3">
									<h6 class="mb-0">Организации</h6>
								</div>
								<div class="card-body p-3">
									<ul class="list-group">
										{#each organizations as org}
											<li class="list-group-item border-0 px-0">
												<span class="text text-2xl text-dark">{org.name} &nbsp; &nbsp;</span>
												<button class="btn btn-primary" on:click={() => selectOrganization(org.id)}>
													{#if org.createdBy === auth.currentUser?.uid}
														Присъедини
													{:else}
														Изпрати заявка
													{/if}
												</button>

												{#if org.createdBy === auth.currentUser?.uid}
													<button class="btn btn-danger" on:click={() => deleteOrganization(org.id)}
														>Изтрий</button
													>
												{/if}
											</li>
										{/each}
									</ul>
								</div>
							</div>{:else}
							<p>Зареждане на организации...</p>
						{/if}
					</div>

					<div class="col-12 col-xl-6 mb-5">
						<div class="card h-100">
							<div class="card-header pb-0 p-3">
								<h6 class="mb-0">Добави нова Организация</h6>
							</div>
							<div class="card-body p-3">
								<form
									on:submit|preventDefault={async () => {
										const user = auth.currentUser;
										if (user && newOrgName.trim() !== '') {
											const orgRef = await addDoc(collection(db, 'organizations'), {
												name: newOrgName,
												createdBy: user.uid
											});
											await setDoc(doc(db, 'organizations', orgRef.id, 'members', user.uid), {
												uid: user.uid
											});
											await updateDoc(doc(db, 'users', user.uid), { selectedOrg: orgRef.id });
											selectedOrg = orgRef.id;
											newOrgName = '';
											await loadOrganizations();
										}
									}}
								>
									<input
										type="text"
										bind:value={newOrgName}
										placeholder="Име на организация"
										required
									/>
									<button class="btn btn-primary" type="submit">Добави</button>
								</form>
							</div>
						</div>
					</div>
				</div>
			</div>
		{/if}

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
	</div>
</body>
