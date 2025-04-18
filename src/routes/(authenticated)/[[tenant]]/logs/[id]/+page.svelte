<script lang="ts">
	import DiscordMessage from './DiscordMessage.svelte';
	import { Badge } from '$lib/components/ui/badge';
	import type { PageData } from './$types';
	import { isSameDay, intlFormat, subMinutes, isAfter } from 'date-fns';
	import Markdown from '$lib/components/markdown/markdown.svelte';
	import type { Message, User } from '$lib/modmail';
	import UserAvatar from '$lib/components/user-avatar.svelte';
	import * as Tooltip from '$lib/components/ui/tooltip';
	import { CopyButton } from '$lib/components/ui/copy-button';
	import { getLocale } from '$lib/paraglide/runtime';
	import { m } from '$lib/paraglide/messages';
	import { clearSearchParams } from '$lib/searchParamUtils';

	// thread isn't undefined in the load function but sveltekit is convinced it is now for some reason
	const { data }: { data: PageData } = $props();

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
		data.thread.messages.map((message) => ({
			...message,
			timestamp: new Date(message.timestamp),
			author: {
				...message.author,
				// remove the size param from the avatar_url if it exists
				avatar_url: clearSearchParams(message.author.avatar_url)
			}
		}))
	);

	const dateFormatter = $derived(
		new Intl.DateTimeFormat(getLocale(), {
			dateStyle: 'medium',
			timeStyle: 'short'
		})
	);
	console.log(data);
</script>

{#snippet user(user: User)}
	<div class="m-2 flex flex-row items-center gap-2">
		<UserAvatar {user} class="size-8" />
		<Tooltip.Provider>
			<Tooltip.Root>
				<Tooltip.Trigger>
					<span class="inline-flex">
						<span class="text-xl font-semibold">{user.name}</span>
						{#if user.discriminator !== '0'}
							<span class="text-xl font-semibold text-muted-foreground">
								#{user.discriminator}
							</span>
						{/if}
					</span>
				</Tooltip.Trigger>
				<Tooltip.Content class="font-mono">
					<span class="inline-flex items-center">
						{user.id}
						<CopyButton text={user.id} class="ms-1 size-8" />
					</span>
				</Tooltip.Content>
			</Tooltip.Root>
		</Tooltip.Provider>
	</div>
{/snippet}

{#if data.thread}
	<div>
		<h1 class="font-mono text-2xl uppercase">{data.thread._id}</h1>
		{#if data.thread.title}
			<h2 class="text-xl">{data.thread.title}</h2>
		{/if}
		{#if data.thread.open}
			<Badge>Open</Badge>
		{:else}
			<Badge variant="destructive">{m.zippy_pretty_martin_radiate()}</Badge>
		{/if}
		{#if data.thread.nfsw}
			<Badge variant="destructive" class="ml-2">{m.sea_mellow_marmot_inspire()}</Badge>
		{/if}
		<div>
			<span>Created</span>
			<time datetime={new Date(data.thread.created_at).toISOString()}>
				{dateFormatter.format(new Date(data.thread.created_at))}
			</time>
		</div>
		{#if data.thread.closed_at}
			<div>
				<span>Closed</span>
				<time datetime={new Date(data.thread.closed_at).toISOString()}>
					{dateFormatter.format(new Date(data.thread.closed_at))}
				</time>
			</div>
		{/if}

		<div class="flex gap-6">
			<div class="flex flex-row items-center p-1">
				<h2>Creator:</h2>
				{@render user(data.thread.creator)}
			</div>
			{#if data.thread.creator.id !== data.thread.recipient.id}
				<div class="flex flex-row items-center p-1">
					<h2>Recipient:</h2>
					{@render user(data.thread.recipient)}
				</div>
			{/if}
		</div>
	</div>
	<h2 class="text-xl font-semibold">Thread Messages</h2>
	<ol class="grid">
		{#each messages as message, i (message.message_id)}
			<!-- If the current message and previous message were sent on different days -->
			<!-- Date divider -->
			{#if i !== 0 && !isSameDay(messages[i - 1].timestamp, message.timestamp)}
				<div class="mb-3 mt-6 flex h-0 w-full items-center justify-center border-t-2 text-xs">
					<span class="-m-1 rounded-sm bg-background px-2">
						{intlFormat(
							new Date(message.timestamp),
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
	{#if data.thread.close_message}
		<div class="gap-y-4 rounded-sm border border-s-8 border-s-red-600 bg-card px-4 py-1">
			<h3 class=" text-xl">{m.born_dry_hare_burn()}</h3>
			<div class="pt-2">
				<Markdown content={data.thread.close_message} type="extended" />
			</div>
			<div class="mt-2 flex items-center gap-4 text-muted-foreground">
				{#if data.thread.closer}
					<span class="inline-flex items-center gap-2 font-semibold">
						<UserAvatar user={data.thread.closer as User} class="size-7" />
						{data.thread.closer?.name}
					</span>
				{/if}
				<time datetime={new Date(data.thread.closed_at as string).toISOString()}>
					{dateFormatter.format(new Date(data.thread.closed_at as string))}
				</time>
			</div>
		</div>
	{/if}
{/if}
