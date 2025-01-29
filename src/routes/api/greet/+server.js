import { json } from '@sveltejs/kit';

export async function GET() {
	try {
		const response = await fetch('http://localhost:11434/api/generate', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				model: 'deepseek-r1:1.5b',
				prompt:
					'Give me a motivational quote! Keep it one sentence and make it sound profesional and no explanation just the quoute.',
				stream: false
			})
		});

		if (!response.ok) throw new Error('Failed to fetch greeting');

		const data = await response.json();

		// Remove `<think>` tags and extract only the greeting
		const cleanedGreeting = data.response.replace(/<think>.*?<\/think>/gs, '').trim();

		return json({ greeting: cleanedGreeting });
	} catch (error) {
		return json({ error: error.message }, { status: 500 });
	}
}
