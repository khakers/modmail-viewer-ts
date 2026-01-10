<script lang="ts">
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
<Inspect.Panel values={{ messages, thread: data.thread }} heading="Thread Messages" />

{#if data.thread}
	<div>
		<div class="flex">
			<h1
				class="w-fit font-mono text-2xl uppercase"
				style={`view-transition-name: log-id-title-${data.thread._id};`}
			>
				{data.thread._id}
			</h1>
			<span class=" ms-8"> <ShareForm shareForm={data.shareForm} /> </span>
			<span class=" ms-8">
				<Dialog.Root>
					<Dialog.Trigger class={buttonVariants({ variant: 'outline' })}>
						{m.soft_sharp_quail_achieve()}
					</Dialog.Trigger>
					<Dialog.Content class="h-[70dvh] content-start md:max-w-2xl">
						<Dialog.Header>
							<Dialog.Title>{m.equal_any_clownfish_clap()}</Dialog.Title>
							<Dialog.Description>{m.spare_crisp_yak_pick()}</Dialog.Description>
						</Dialog.Header>

						<Table.Root>
							<Table.Caption>{m.gross_muddy_peacock_attend()}</Table.Caption>
							<Table.Header>
								<Table.Row>
									<Table.Head class="w-[100px]">{m.fun_clear_gibbon_bake()}</Table.Head>
									<Table.Head>{m.many_smart_jackal_twist()}</Table.Head>
									<Table.Head>{m.low_helpful_barbel_sprout()}</Table.Head>
									<Table.Head>{m.direct_yummy_ox_quell()}</Table.Head>
									<Table.Head>{m.warm_mushy_piranha_burn()}</Table.Head>
									<Table.Head>{m.stout_white_trout_dine()}</Table.Head>
									<Table.Head>{m.calm_salty_piranha_link()}</Table.Head>
									<Table.Head>{m.tame_empty_tiger_type()}</Table.Head>
								</Table.Row>
							</Table.Header>
							<Table.Body class="overflow-y-auto">
								{#each data.shares as share (share.id)}
									<Table.Row>
										<Table.Cell class="font-mono select-all">
											{encodeBase64UUID(share.id)}
										</Table.Cell>
										<Table.Cell>
											<Checkbox checked={share.enabled} disabled={true} />
										</Table.Cell>
										<Table.Cell>
											{#if share.creatorDiscordUserId === data.user.discordUserId}
												{m.fancy_acidic_shrimp_skip()}
											{:else}
												{share.creatorDiscordUserId}
											{/if}
										</Table.Cell>
										<Table.Cell>
											{#if share.requireAuthentication}
												<ShieldCheckIcon class="size-4.5" />
											{/if}
										</Table.Cell>
										<Table.Cell>
											{#if share.showAnonymousSenderName}
												<CheckIcon class="size-4.5" />
											{/if}
										</Table.Cell>
										<Table.Cell>
											{#if share.showInternalMessages}
												<CheckIcon class="size-4.5" />
											{/if}
										</Table.Cell>
										<Table.Cell>
											{#if share.showSystemMessages}
												<CheckIcon class="size-4.5" />
											{/if}
										</Table.Cell>
										<Table.Cell>
											{share.expiresAt}
										</Table.Cell>
									</Table.Row>
								{/each}
							</Table.Body>
						</Table.Root>
					</Dialog.Content>
				</Dialog.Root>
			</span>
		</div>
		{#if data.thread.title}
			<h2 class="text-xl">{data.thread.title}</h2>
		{/if}
		{#if data.thread.open}
			<Badge style={`view-transition-name: log-${data.thread._id}-badge;`}>
				<CircleDot class="me-1 h-4" />{m.deft_wild_platypus_peel()}
			</Badge>
		{:else}
			<Badge
				variant="destructive"
				style={`view-transition-name: log-${data.thread._id}-badge;`}
			>
				<CircleCheck class="me-1 h-4" />
				{m.zippy_pretty_martin_radiate()}
			</Badge>
		{/if}
		{#if data.thread.nfsw}
			<Badge variant="destructive" class="ml-2">{m.sea_mellow_marmot_inspire()}</Badge>
		{/if}
		<div>
			<span>{m.ago_knotty_dingo_kiss()}</span>
			<time datetime={new Date(data.thread.created_at).toISOString()}>
				{dateFormatter.format(new Date(data.thread.created_at))}
			</time>
		</div>
		{#if data.thread.closed_at}
			<div>
				<span>{m.agent_watery_albatross_renew()}</span>
				<time datetime={new Date(data.thread.closed_at).toISOString()}>
					{dateFormatter.format(new Date(data.thread.closed_at))}
				</time>
			</div>
		{/if}

		<div class="flex gap-6">
			<div class="flex flex-row items-center p-1 ps-0">
				<h2>{m.teary_mild_boar_hope()}</h2>
				{@render user(data.thread.creator)}
			</div>
			{#if data.thread.creator.id !== data.thread.recipient.id}
				<div class="flex flex-row items-center p-1 ps-0">
					<h2>{m.alive_true_salmon_drop()}</h2>
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
				<div
					class="mt-6 mb-3 flex h-0 w-full items-center justify-center border-t-2 text-xs"
				>
					<span class="bg-background -m-1 rounded-sm px-2">
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
	{#if data.thread.close_message !== undefined && data.thread.close_message !== null}
		<div class="bg-card gap-y-4 rounded-sm border border-s-8 border-s-red-600 px-4 py-1">
			<h3 class=" text-xl">{m.born_dry_hare_burn()}</h3>
			<div class="pt-2">
				<Markdown content={data.thread.close_message ?? ''} type="extended" />
			</div>
			<div class="text-muted-foreground mt-2 flex items-center gap-4">
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
