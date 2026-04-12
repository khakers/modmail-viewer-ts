<script lang="ts">
	import type { Snippet } from 'svelte';
	import * as HoverCard from '$lib/components/ui/hover-card/index.js';
	import type { User } from '$lib/modmail';
	import { getThreadsForUser } from '../../../routes/(authenticated)/[[tenant]]/logs/thread.remote';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import ThreadStatusBadge from './thread-status-badge.svelte';
	import { CopyButton } from '../ui/copy-button';
	import ThreadHoverCard from './thread-hover-card.svelte';

	let { children, user }: { children: Snippet; user: User } = $props();

	const id = $props.id();
</script>

<HoverCard.Root>
	<HoverCard.Trigger>
		{@render children()}
	</HoverCard.Trigger>
	<HoverCard.Content class="w-80">
		<svelte:boundary>
			<div class="flex flex-col gap-2">
				<div class="flex items-baseline gap-2">
					<span class="text-xl font-semibold">{user.name}</span>
					<span class="text-muted-foreground text-sm">{user.id}</span>
					<CopyButton class="ms-auto" text={user.id} />
				</div>
				<ul class="grid gap-2 text-sm">
					{#each await getThreadsForUser(user.id) as thread (thread._id)}
						<li class="grid grid-cols-[minmax(0,1fr)_max-content] items-center">
							<ThreadHoverCard {thread}>
								<a
									href={resolve(`/(authenticated)/[[tenant]]/logs/[id]`, {
										id: thread._id,
										tenant: page.params.tenant
									})}
									class="font-mono uppercase"
								>
									{thread.key}
								</a>
							</ThreadHoverCard>
							<ThreadStatusBadge {thread} transitionId={thread._id ?? id} />
						</li>
					{/each}
				</ul>
			</div>
		</svelte:boundary>
	</HoverCard.Content>
</HoverCard.Root>

<style>
</style>
