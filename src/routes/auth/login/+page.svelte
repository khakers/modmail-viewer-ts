<script lang="ts">
	import type { PageData } from './$types';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import { m } from '$lib/paraglide/messages';

	let { data }: { data: PageData } = $props();
</script>

<div class="flex h-screen w-full items-center justify-center px-4">
	<Card.Root class="mx-auto max-w-sm">
		<Card.Header>
			<Card.Title class="text-2xl">{m.crazy_crisp_gadfly_grip()}</Card.Title>
			<Card.Description>{m.wide_real_mule_stop()}</Card.Description>
		</Card.Header>
		<Card.Content>
			<div class="grid gap-4">
				<Button class="w-full" href="/auth/login/discord">{m.calm_brief_lion_cuddle()}</Button>
			</div>
			<div class="mt-4 text-center text-sm">
				{m.crazy_slow_lion_drop()}
			</div>
		</Card.Content>
	</Card.Root>
</div>