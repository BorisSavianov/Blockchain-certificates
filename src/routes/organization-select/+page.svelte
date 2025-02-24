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
			await setDoc(doc(db, 'organizations', orgId, 'requests', user.uid), {
				uid: user.uid
			});
			alert('Request sent to join the organization. Wait for approval.');
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
		await addDoc(doc(db, 'users', userId), { selectedOrg: orgId });
		await deleteDoc(doc(db, 'organizations', orgId, 'requests', userId));
		await loadMembershipRequests(orgId);
	}

	async function denyRequest(orgId, userId) {
		await deleteDoc(doc(db, 'organizations', orgId, 'requests', userId));
		await loadMembershipRequests(orgId);
	}

	async function removeMember(orgId, userId) {
		await deleteDoc(doc(db, 'organizations', orgId, 'members', userId));
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

{auth.currentUser.uid}
{#if selectedOrg}
	<h1>Your Selected Organization</h1>
	{#if organizationDetails}
		<p>Organization Name: {organizationDetails.name}</p>
		<p>Organization ID: {organizationDetails.id}</p>
		{#if organizationDetails.createdBy === auth.currentUser?.uid}
			<h2>Membership Requests</h2>
			<ul>
				{#each membershipRequests as request}
					<li>
						User ID: {request.uid}
						<button on:click={() => approveMember(selectedOrg, request.uid)}>Approve</button>
						<button on:click={() => denyRequest(selectedOrg, request.uid)}>Deny</button>
					</li>
				{/each}
			</ul>
		{/if}
	{/if}
	<button on:click={() => removeMember(selectedOrg, auth.currentUser?.uid)}
		>Leave Organization</button
	>
{:else}
	<h1>Select Your Organization</h1>
	{#if organizations.length}
		<ul>
			{#each organizations as org}
				<li>
					<span>{org.name}</span>
					<button on:click={() => selectOrganization(org.id)}>Request to Join</button>
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
	<form
		on:submit|preventDefault={async () => {
			const user = auth.currentUser;
			if (user && newOrgName.trim() !== '') {
				const orgRef = await addDoc(collection(db, 'organizations'), {
					name: newOrgName,
					createdBy: user.uid
				});
				await setDoc(doc(db, 'organizations', orgRef.id, 'members', user.uid), { uid: user.uid });
				await updateDoc(doc(db, 'users', user.uid), { selectedOrg: orgRef.id });
				selectedOrg = orgRef.id;
				newOrgName = '';
				await loadOrganizations();
			}
		}}
	>
		<input type="text" bind:value={newOrgName} placeholder="Organization Name" required />
		<button type="submit">Add Organization</button>
	</form>
{/if}
