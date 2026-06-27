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

	const currentThreadId = $derived.by(() => {
		const threadId = page.params.id;
		return typeof threadId === 'string' ? threadId : null;
	});
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
								{#if thread._id === currentThreadId}
									<span class="font-mono uppercase">
										{thread.key}
									</span>
								{:else}
									<a
										href={resolve(`/(authenticated)/[[tenant]]/logs/[id]`, {
											id: thread._id,
											tenant: page.params.tenant
										})}
										class="font-mono uppercase"
									>
										{thread.key}
									</a>
								{/if}
							</ThreadHoverCard>
							{#if thread._id === currentThreadId}
								<span
									class="text-green-500"
									aria-label="Currently viewing this thread"
								>
									●
								</span>
							{:else}
								<ThreadStatusBadge {thread} transitionId={thread._id ?? id} />
							{/if}
						</li>
					{/each}
				</ul>
			</div>
		</svelte:boundary>
	</HoverCard.Content>
</HoverCard.Root>

<style>
</style>
