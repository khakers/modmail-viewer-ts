<script lang="ts">
	import type { PageData } from './$types';
	import { Button } from '$lib/components/ui/button';
	import * as Table from '$lib/components/ui/table/index.js';
	import { enhance } from '$app/forms';
	import { m } from '$lib/paraglide/messages';
	import * as HoverCard from '$lib/components/ui/hover-card';
	import { CircleHelp } from '@lucide/svelte';

	let { data }: { data: PageData } = $props();
</script>

<h1 class="text-2xl">{m.topical_top_cockroach_edit()}</h1>

<h2 class="text-xl">{m.funny_wacky_skate_achieve()}</h2>
<form action="?/revokeAllSessions" method="post" use:enhance>
	<div class="flex flex-row items-center gap-3">
		<Button id="revokeAllButton" variant="destructive" type="submit">
			{m.still_royal_wombat_evoke()}
		</Button>
		<HoverCard.Root>
			<HoverCard.Trigger><CircleHelp /></HoverCard.Trigger>
			<HoverCard.Content>
				<label for="revokeAllButton">
					{m.trite_super_stingray_hope()}
				</label>
			</HoverCard.Content>
		</HoverCard.Root>
	</div>
</form>
<Table.Root>
	<Table.Caption>{m.low_white_mare_fond()}</Table.Caption>
	<Table.Header>
		<Table.Row>
			<Table.Head></Table.Head>
			<Table.Head>{m.witty_acidic_finch_explore()}</Table.Head>
			<Table.Head>{m.due_cuddly_anteater_pave()}</Table.Head>
			<Table.Head></Table.Head>
		</Table.Row>
	</Table.Header>
	<Table.Body>
		{#each data.sessions as session (session.id)}
			<Table.Row>
				<Table.Cell class="font-medium">
					{#if session.id === data.session.id}
						(Current Session)
					{/if}
				</Table.Cell>
				<Table.Cell>{session.createdAt}</Table.Cell>
				<Table.Cell>{session.expiresAt}</Table.Cell>
				<Table.Cell>
					<form action="?/revokeSession" method="post" use:enhance>
						<input
							type="hidden"
							name="sessionId"
							id="sessionId"
							value={session.id}
							required
						/>
						<Button variant="destructive" type="submit">
							{m.plane_key_lemming_fond()}
						</Button>
					</form>
				</Table.Cell>
			</Table.Row>
		{/each}
	</Table.Body>
</Table.Root>
