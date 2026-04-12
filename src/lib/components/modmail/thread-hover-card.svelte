<script lang="ts">
	import type { ModmailThread } from '$lib/modmail';
	import { m } from '$lib/paraglide/messages';
	import * as HoverCard from '$lib/components/ui/hover-card/index.js';
	import UserAvatar from '$lib/components/user-avatar.svelte';
	import type { Snippet } from 'svelte';

	let { children, thread }: { children: Snippet; thread: ModmailThread & { message_count?: number } } = $props();

	console.log(thread);
</script>

<HoverCard.Root>
	<HoverCard.Trigger href={'./logs/' + thread._id}>
		{#if children}
			{@render children()}
		{:else}
			<span
				class="font-mono uppercase"
				style={`view-transition-name: log-id-title-${thread._id};`}>{thread._id}</span
			>
		{/if}
	</HoverCard.Trigger>
	<HoverCard.Content>
		<div class="flex justify-start space-x-2">
			{#if thread.messages.length >= 1}
				{@const sender =
					thread.messages[thread.messages.length - 1]?.author ?? thread.recipient}
				<UserAvatar user={sender} class="size-10" />
				<div class="space-y-1">
					<h4 class="text-sm font-semibold">
						{sender.name}
					</h4>
					<div>
						<h5 class="text-sm">
							{m.agent_moving_anteater_jump()}
						</h5>
						<p
							class="border-muted bg-accent max-h-24 overflow-hidden rounded-md border-2 px-1 text-sm"
						>
							{thread.messages[thread.messages.length - 1]?.content}
						</p>
					</div>
					<div class="flex items-center pt-1">
						<span class="text-muted-foreground text-xs"
							>{thread.message_count ?? thread.messages.length} messages</span
						>
					</div>
				</div>
			{:else}
				<p class="text-muted-foreground text-sm italic">
					{m.simple_merry_slug_chop()}
				</p>
			{/if}
		</div>
	</HoverCard.Content>
</HoverCard.Root>

<style>
</style>
