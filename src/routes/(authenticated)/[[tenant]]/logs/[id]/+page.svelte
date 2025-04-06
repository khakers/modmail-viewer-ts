<script lang="ts">
	import DiscordMessage from './DiscordMessage.svelte';

	import * as Avatar from '$lib/components/ui/avatar';
	import { Badge } from '$lib/components/ui/badge';
	import type { PageData } from './$types';
	import { isSameDay, intlFormat, subMinutes, isAfter } from 'date-fns';
	import Markdown from '$lib/components/markdown/markdown.svelte';

	const { data }: { data: PageData } = $props();

	function clearSearchParams(baseUrl: string) {
		// Clear search params from the URL to avoid confusion when navigating back
		const url = new URL(baseUrl);
		url.search = '';
		return url.toString();
	}

	const messages = $derived(
		data.document.messages.map((message) => ({
			...message,
			timestamp: new Date(message.timestamp),
			author: {
				...message.author,
				// remove the size param from the avatar_url if it exists
				avatar_url: clearSearchParams(message.author.avatar_url)
			}
		}))
	);
	console.log(data);
</script>

<div>
	<h1 class="text-2xl">{data.document._id}</h1>
	{#if data.document.open}
		<Badge>Open</Badge>
	{:else}
		<Badge variant="destructive">Closed</Badge>
	{/if}
	{#if data.document.nfsw}
		<Badge variant="destructive" class="ml-2">NSFW</Badge>
	{/if}
	<div>
		<span>Created at</span>
		<time datetime={data.document.created_at}>{data.document.created_at}</time>
	</div>
	<div>
		<span>Closed at</span>
		<time datetime={data.document.closed_at}>{data.document.closed_at}</time>
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
					{intlFormat(new Date(message.timestamp), {
						year: 'numeric',
						month: 'short',
						day: 'numeric'
					})}
				</span>
			</div>
		{/if}
		<li class="" id={message.message_id}>
			<DiscordMessage message={message}
											showUserProfile={!data.document.messages[i - 1] || data.document.messages[i - 1].author.id !== message.author.id || isAfter(subMinutes(message.timestamp, 5), messages[i - 1].timestamp)} />
			 <Markdown content={message.content} type="extended" />
		</li>
	{/each}
</ol>
{#if data.document.close_message}
	<div class="border rounded-sm p-4 border-red-600">
		<h3 class="text-xl">Closed by <span class="font-semibold">{data.document.closer?.name}</span> at
			<time datetime={data.document.closed_at}>{new Date(data.document.closed_at)}</time>
		</h3>

		<Markdown content={data.document.close_message} type="extended" />
	</div>
{/if}
