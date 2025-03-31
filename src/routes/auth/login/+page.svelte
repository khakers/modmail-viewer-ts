<script lang="ts">
	import type { PageData } from './$types';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card/index.js';

	let { data }: { data: PageData } = $props();
</script>

<div class="flex h-screen w-full items-center justify-center px-4">
	<Card.Root class="mx-auto max-w-sm">
		<Card.Header>
			<Card.Title class="text-2xl">Login</Card.Title>
			<Card.Description>Sign in through Discord to gain access to Modmail</Card.Description>
		</Card.Header>
		<Card.Content>
			<div class="grid gap-4">
				<Button class="w-full" href="/auth/login/discord">Login with Discord</Button>
			</div>
			<div class="mt-4 text-center text-sm">
				Your data will be used to authenticate you and provide access to the application. 
                By logging in, you agree to our <a class="text-blue-500 hover:underline" href="/terms">Terms of Service</a> and <a class="text-blue-500 hover:underline" href="/privacy">Privacy Policy</a>.
			</div>
		</Card.Content>
	</Card.Root>
</div>