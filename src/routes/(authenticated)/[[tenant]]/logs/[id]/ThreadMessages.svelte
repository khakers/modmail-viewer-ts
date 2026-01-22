<script lang="ts">
	import DiscordMessage from '$lib/components/DiscordMessage.svelte';
	import type { Message, ModmailThread, User } from '$lib/modmail';
	import { m } from '$lib/paraglide/messages';
	import { getLocale } from '$lib/paraglide/runtime';
	import { clearSearchParams } from '$lib/searchParamUtils';
	import { intlFormat, isAfter, isSameDay, subMinutes } from 'date-fns';
	import Inspect from 'svelte-inspect-value';

	// thread isn't undefined in the load function but sveltekit is convinced it is now for some reason
	const { thread }: { thread: ModmailThread } = $props();

	function shouldShowMessageProfile(message: Message, previousMessage: Message | undefined) {
		// Show the profile if the message is the first message in the thread
		// or if the message is from a different user than the previous message
		// or if the message is from the same user but was sent more than 5 minutes after the previous message
		// or if the previous message was sent differently (staff/not staff, internal, anon)
		if (!previousMessage) return true;
		if (message.author.id !== previousMessage.author.id) return true;
		if (message.type !== previousMessage.type) return true;
		if (message.author.mod !== previousMessage.author.mod) return true;
		if (isAfter(subMinutes(message.timestamp, 5), previousMessage.timestamp)) return true;
		return false;
	}

	const messages = $derived(
		thread.messages.map((message) => ({
			...message,
			timestamp: new Date(message.timestamp),
			author: {
				...message.author,
				// remove the size param from the avatar_url if it exists
				avatar_url: clearSearchParams(message.author.avatar_url)
			}
		}))
	);
</script>

<svelte:boundary>
	<ol class="grid">
		{#each messages as message, i (message.message_id)}
			<!-- If the current message and previous message were sent on different days -->
			<!-- Date divider -->
			{#if i !== 0 && !isSameDay(messages[i - 1].timestamp, message.timestamp)}
				<div
					class="mt-6 mb-3 flex h-0 w-full items-center justify-center border-t-2 text-xs"
				>
					<span class="bg-background -m-1 rounded-sm px-2">
						{intlFormat(
							message.timestamp,
							{
								year: 'numeric',
								month: 'short',
								day: 'numeric'
							},
							{
								locale: getLocale()
							}
						)}
					</span>
				</div>
			{/if}
			<li class="" id={message.message_id}>
				<DiscordMessage
					{message}
					showUserProfile={shouldShowMessageProfile(message, messages[i - 1])}
				/>
			</li>
		{/each}
	</ol>
</svelte:boundary>
