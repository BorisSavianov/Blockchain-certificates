<script>
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { auth, db } from '$lib/firebase'; // Adjust the path as needed
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
			await updateDoc(doc(db, 'users', user.uid), {
				selectedOrg: orgId
			});

			await addUserToOrganization(orgId, user.uid);
			selectedOrg = orgId; // Update local state
			await fetchOrganization(orgId);
		}
	}

	async function addUserToOrganization(orgId, userId) {
		await setDoc(doc(db, 'organizations', orgId, 'members', userId), {
			uid: userId
		});
	}

	async function fetchOrganization(orgId) {
		const orgDoc = await getDoc(doc(db, 'organizations', orgId));
		if (orgDoc.exists()) {
			organizationDetails = {
				id: orgDoc.id,
				...orgDoc.data()
			};
		} else {
			organizationDetails = null;
			console.log('Organization not found.');
		}
	}

	async function addOrganization() {
		const user = auth.currentUser;
		if (user && newOrgName.trim() !== '') {
			await addDoc(collection(db, 'organizations'), {
				name: newOrgName,
				createdBy: user.uid
			});
			newOrgName = '';
			await loadOrganizations();
		}
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

	async function quitOrganization() {
		const user = auth.currentUser;
		if (user) {
			await updateDoc(doc(db, 'users', user.uid), {
				selectedOrg: null
			});
			await deleteDoc(doc(db, 'organizations', selectedOrg, 'members', user.uid));
			selectedOrg = null; // Update local state
			organizationDetails = null; // Clear organization details
			await loadOrganizations();
		}
	}
</script>

{#if selectedOrg}
	<h1>Your Selected Organization</h1>
	{#if organizationDetails}
		<p>Organization Name: {organizationDetails.name}</p>
		<p>Organization ID: {organizationDetails.id}</p>
	{/if}
	<button on:click={quitOrganization}>Quit Organization</button>
{:else}
	<h1>Select Your Organization</h1>
	{#if organizations.length}
		<ul>
			{#each organizations as org}
				<li>
					<span>{org.name}</span>
					<button on:click={() => selectOrganization(org.id)}>Select</button>
					{#if org.createdBy === auth.currentUser?.uid}
						<button on:click={() => deleteOrganization(org.id)}>Delete</button>
					{/if}
				</li>
			{/each}
		</ul>
	{:else}
		<p>Loading organizations...</p>
	{/if}

	<h2>Add a New Organization</h2>
	<form on:submit|preventDefault={addOrganization}>
		<input type="text" bind:value={newOrgName} placeholder="Organization Name" required />
		<button type="submit">Add Organization</button>
	</form>
{/if}
