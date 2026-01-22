<script lang="ts">
	import ThreadMessages from './ThreadMessages.svelte';

	import DiscordMessage from '$lib/components/DiscordMessage.svelte';
	import Markdown from '$lib/components/markdown/markdown.svelte';
	import { Badge } from '$lib/components/ui/badge';
	import { CopyButton } from '$lib/components/ui/copy-button';
	import * as Tooltip from '$lib/components/ui/tooltip';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import * as Table from '$lib/components/ui/table';
	import UserAvatar from '$lib/components/user-avatar.svelte';
	import type { Message, User } from '$lib/modmail';
	import { m } from '$lib/paraglide/messages';
	import { getLocale } from '$lib/paraglide/runtime';
	import { clearSearchParams } from '$lib/searchParamUtils';
	import {
		CheckIcon,
		CircleCheck,
		CircleCheckIcon,
		CircleDot,
		CircleXIcon,
		ShieldCheckIcon
	} from '@lucide/svelte';
	import { intlFormat, isAfter, isSameDay, subMinutes } from 'date-fns';
	import Inspect from 'svelte-inspect-value';
	import type { PageData } from './$types';
	import ShareForm from './ShareForm.svelte';
	import { buttonVariants } from '$lib/components/ui/button';
	import { encodeBase64UUID } from '$lib/uuid-utils';
	import { Checkbox } from '$lib/components/ui/checkbox';
	import ThreadShareForm from './thread-share-form.svelte';
	import ThreadShareModal from './thread-share-modal.svelte';
	import { getThread } from '../log.remote';
	import { page } from '$app/state';

	// thread isn't undefined in the load function but sveltekit is convinced it is now for some reason
	const { data }: { data: PageData } = $props();

	const id = page.params.id;

	const thread = $derived.by(async () => {
		const thread = await getThread(id);
		return {
			...thread,
			messages: thread.messages.map((message) => ({
				...message,
				timestamp: new Date(message.timestamp),
				author: {
					...message.author,
					// remove the size param from the avatar_url if it exists
					avatar_url: clearSearchParams(message.author.avatar_url)
				}
			}))
		};
	});

	const dateFormatter = $derived(
		new Intl.DateTimeFormat(getLocale(), {
			dateStyle: 'medium',
			timeStyle: 'short'
		})
	);
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
							<span class="text-muted-foreground text-xl font-semibold">
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

{#snippet booleanIcon(value: boolean)}
	{#if value}
		<CheckIcon />
	{:else}
		<CircleXIcon />
	{/if}
{/snippet}
<!-- TODO show when in development only -->
<Inspect.Panel
	values={{ messages: (await thread).messages, thread: data.thread }}
	heading="Thread Messages"
/>

<svelte:boundary>
	{#await thread}
		<p>Loading thread...</p>
	{:then thread}
		<div>
			<div class="flex">
				<h1
					class="w-fit font-mono text-2xl uppercase"
					style={`view-transition-name: log-id-title-${thread._id};`}
				>
					{thread._id}
				</h1>
				<span class=" ms-8">
					<!-- <ShareForm shareForm={data.shareForm} />  -->
					<ThreadShareForm
						threadId={thread._id}
						currentUserId={data.user.discordUserId}
					/>
				</span>
				<span class=" ms-8">
					<ThreadShareModal
						currentUserId={data.user.discordUserId}
						threadId={thread._id}
					/>
				</span>
			</div>
			{#if thread.title}
				<h2 class="text-xl">{thread.title}</h2>
			{/if}
			{#if thread.open}
				<Badge style={`view-transition-name: log-${thread._id}-badge;`}>
					<CircleDot class="me-1 h-4" />{m.deft_wild_platypus_peel()}
				</Badge>
			{:else}
				<Badge
					variant="destructive"
					style={`view-transition-name: log-${thread._id}-badge;`}
				>
					<CircleCheck class="me-1 h-4" />
					{m.zippy_pretty_martin_radiate()}
				</Badge>
			{/if}
			{#if thread.nfsw}
				<Badge variant="destructive" class="ml-2">{m.sea_mellow_marmot_inspire()}</Badge>
			{/if}
			<div>
				<span>{m.ago_knotty_dingo_kiss()}</span>
				<time datetime={new Date(thread.created_at).toISOString()}>
					{dateFormatter.format(new Date(thread.created_at))}
				</time>
			</div>
			{#if thread.closed_at}
				<div>
					<span>{m.agent_watery_albatross_renew()}</span>
					<time datetime={new Date(thread.closed_at).toISOString()}>
						{dateFormatter.format(new Date(thread.closed_at))}
					</time>
				</div>
			{/if}

			<div class="flex gap-6">
				<div class="flex flex-row items-center p-1 ps-0">
					<h2>{m.teary_mild_boar_hope()}</h2>
					{@render user(thread.creator)}
				</div>
				{#if thread.creator.id !== thread.recipient.id}
					<div class="flex flex-row items-center p-1 ps-0">
						<h2>{m.alive_true_salmon_drop()}</h2>
						{@render user(thread.recipient)}
					</div>
				{/if}
			</div>
		</div>
		<h2 class="text-xl font-semibold">Thread Messages</h2>
		<ThreadMessages {thread}/>
		{#if thread.close_message !== undefined && thread.close_message !== null}
			<div class="bg-card gap-y-4 rounded-sm border border-s-8 border-s-red-600 px-4 py-1">
				<h3 class=" text-xl">{m.born_dry_hare_burn()}</h3>
				<div class="pt-2">
					<Markdown content={thread.close_message ?? ''} type="extended" />
				</div>
				<div class="text-muted-foreground mt-2 flex items-center gap-4">
					{#if thread.closer}
						<span class="inline-flex items-center gap-2 font-semibold">
							<UserAvatar user={thread.closer as User} class="size-7" />
							{thread.closer?.name}
						</span>
					{/if}
					<time datetime={new Date(thread.closed_at as string).toISOString()}>
						{dateFormatter.format(new Date(thread.closed_at as string))}
					</time>
				</div>
			</div>
		{/if}
	{/await}
	{#snippet pending()}
		<p>loading...</p>
	{/snippet}
	{#snippet failed(error, reset)}
		<button onclick={reset}>oops! try again</button>
	{/snippet}
</svelte:boundary>
