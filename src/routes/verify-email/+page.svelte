<script>
	import { auth } from '$lib/firebase';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';

	let user = null;
	let message = '';

	onMount(() => {
		user = auth.currentUser;
		if (user && user.emailVerified) {
			goto('/');
		}
	});

	async function resendVerificationEmail() {
		try {
			if (user) {
				await user.reload();
				if (!user.emailVerified) {
					await user.sendEmailVerification();
					message = 'Верификационен имейл изпратен. Моля проверете пощата си.';
				} else {
					message = 'Вашият имейл вече е потвърден. Връщане в начало.';
					goto('/');
				}
			}
		} catch (error) {
			console.error('Грешка при изпращане на имейл:', error);
			message = 'Грешка при изпращане на имейл. Моля опитайте по-късно.';
		}
	}

	async function deleteAccount() {
		try {
			if (user) {
				await user.delete();
				alert('Вашият акаунт е изтрит.');
				goto('/login');
			}
		} catch (error) {
			console.error('Грешка при изтриване на акаунт:', error);
			message = 'Грешка при изтриване на акаунт. Моля опитайте по-късно.';
		}
	}
</script>

<html lang="en">
	<head>
		<meta charset="utf-8" />
		<meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
		<link rel="apple-touch-icon" sizes="76x76" href="assets/img/apple-icon.png" />
		<link rel="icon" type="image/png" href="assets/img/favicon.png" />
		<title>Начало</title>
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

	<main>
		<h1>Задължително потвърждаване на имейл</h1>
		<p>
			Моля, потвърдете своя имейл адрес, за да продължите да използвате платформата. Проверете
			пощата си за имейл за потвърждение.
		</p>

		{#if message}
			<p>{message}</p>
		{/if}

		<button class="btn btn-primary" on:click={resendVerificationEmail}>Изпрати нов имейл</button>
		<button
			class="btn btn-danger"
			on:click={deleteAccount}
			style="margin-top: 10px; background-color: red;">Изтрий акаунт</button
		>
	</main>
</html>

<style>
	main {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		height: 100vh;
		text-align: center;
	}

	button {
		margin-top: 20px;
		padding: 10px 20px;
		color: white;
		border: none;
		border-radius: 5px;
		cursor: pointer;
	}
</style>
