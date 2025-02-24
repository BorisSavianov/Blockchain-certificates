import { json } from '@sveltejs/kit';

export async function GET({ url }) {
	try {
		const params = url.searchParams.get('params') || '';

		const response = await fetch('http://localhost:11434/api/generate', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				model: 'deepseek-r1:1.5b',
				prompt: `Write a description for an organization based on these characteristics: ${params}; keep it short and simple`,
				stream: false
			})
		});

		if (!response.ok) throw new Error('Failed to fetch greeting');

		const data = await response.json();
		const cleanedGreeting = data.response.replace(/<think>.*?<\/think>/gs, '').trim();

		return json({ greeting: cleanedGreeting });
	} catch (error) {
		return json({ error: error.message }, { status: 500 });
	}
}

/*<form on:submit|preventDefault={fetchMessage}>
<label>
Enter characteristics:
<input type="text" bind:value={params} required />
</label>
<button type="submit">Generate Description</button>
</form>
<p>{$greeting}</p>*/
