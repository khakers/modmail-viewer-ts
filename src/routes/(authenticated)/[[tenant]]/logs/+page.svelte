<script lang="ts">
	import type { PageData } from './$types';
	import * as Table from '$lib/components/ui/table';
	import type { ModmailThread } from '$lib/modmail';
	import { Badge } from '$lib/components/ui/badge';
	import CircleDot from '@lucide/svelte/icons/circle-dot';
	import CircleCheck from '@lucide/svelte/icons/circle-check';
	import { m } from '$lib/paraglide/messages';
	import * as HoverCard from '$lib/components/ui/hover-card/index.js';
	import HoverDate from '$lib/components/hover-date.svelte';
	import UserAvatar from '$lib/components/user-avatar.svelte';
	import Paginator from '$lib/components/paginator.svelte';
	import { urlWithSearchParams } from '$lib/searchParamUtils';
	import { page } from '$app/state';

	let { data }: { data: PageData } = $props();

	$inspect(data);
</script>

{#snippet ticketStatus(thread: ModmailThread)}
	{#if thread.open}
		<Badge><CircleDot class="me-1 h-4" />{m.deft_wild_platypus_peel()}</Badge>
	{:else}
		<Badge variant="secondary">
			<CircleCheck class="me-1 h-4" />
			{m.gross_sharp_nuthatch_bloom()}
		</Badge>
	{/if}
{/snippet}

<div class="flex flex-row items-baseline gap-8">
	<h2 class="text-xl">{m.jumpy_careful_iguana_wave()}</h2>
	<div
		class="inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground"
	>
		<a
			class="inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
			href={urlWithSearchParams(page.url, [['status', 'all']])}
			data-state={data.statusFilter === 'all' ? 'active' : 'inactive'}
		>
			{m.zesty_royal_pig_thrive()}
		</a>
		<a
			class="inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
			href={urlWithSearchParams(page.url, [['status', 'open']])}
			data-state={data.statusFilter === 'open' ? 'active' : 'inactive'}
		>
			{m.round_cuddly_gazelle_transform()}
		</a>
		<a
			class="inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
			href={urlWithSearchParams(page.url, [['status', 'closed']])}
			data-state={data.statusFilter === 'closed' ? 'active' : 'inactive'}
		>
			{m.patchy_mild_boar_urge()}
		</a>
	</div>
	<div>
		Threads:
		<span class="font-mono">
			{data.threadCount}
		</span>
	</div>
</div>
<div class="w-full overflow-auto">
	<Table.Root>
		<Table.Caption>{m.merry_aloof_goat_fond()}</Table.Caption>
		<Table.Header>
			<Table.Row>
				<Table.Head class="w-[100px]">{m.sharp_these_pug_transform()}</Table.Head>
				<Table.Head>{m.weary_tough_otter_fall()}</Table.Head>
				<Table.Head>{m.plane_petty_impala_buy()}</Table.Head>
				<Table.Head>{m.fuzzy_lazy_bee_list()}</Table.Head>
				<Table.Head>{m.frail_swift_elk_hurl()}</Table.Head>
				<Table.Head>{m.every_day_duck_rest()}</Table.Head>
			</Table.Row>
		</Table.Header>
		<Table.Body>
			{#each data.threads as thread (thread._id)}
				<!-- Display the recipient if the recipient is different than the creator -->
				<Table.Row>
					<Table.Cell class="font-medium">
						<HoverCard.Root>
							<HoverCard.Trigger href={'./logs/' + thread._id}>
								{thread._id}
							</HoverCard.Trigger>
							<HoverCard.Content>
								<div class="flex justify-start space-x-2">
									<UserAvatar user={thread.recipient} class="size-10" />
									<div class="space-y-1">
										<h4 class="text-sm font-semibold">{thread.recipient.name}</h4>
										<h5 class="text-sm">{m.agent_moving_anteater_jump()}</h5>
										<p class="text-sm">{thread.messages[thread.messages.length - 1]?.content}</p>
										<div class="flex items-center pt-1">
											<!-- <CalendarDays class="mr-2 size-4 opacity-70" /> -->
											<span class="text-xs text-muted-foreground"
												>{thread.message_count} messages</span
											>
										</div>
									</div>
								</div>
							</HoverCard.Content>
						</HoverCard.Root>
					</Table.Cell>
					<Table.Cell>{@render ticketStatus(thread)}</Table.Cell>
					<Table.Cell>
						<div class="flex flex-row items-center gap-2">
							<UserAvatar user={thread.recipient} class="size-6" />
							{thread.recipient.name}
						</div>
					</Table.Cell>
					<Table.Cell class="max-w-64 truncate">
						{#if thread.messages[0]?.content}
							{thread.messages[0].content}
						{:else}
							<span class="text-muted-foreground">{m.seemly_next_blackbird_dig()}</span>
						{/if}
					</Table.Cell>
					<Table.Cell>
						<HoverDate date={new Date(thread.created_at)} />
					</Table.Cell>
					<Table.Cell>
						{#if thread.messages[0]?.content}
							<HoverDate date={new Date(thread.messages[0]?.timestamp)} />
						{/if}
					</Table.Cell>
				</Table.Row>
			{/each}
		</Table.Body>
	</Table.Root>
	{#if data.threads.length === 0}
		<div class="m-4 flex w-full table-auto items-center justify-center">
			<h3>{m.bad_slow_camel_pet()}</h3>
		</div>
	{/if}
</div>

<Paginator index={data.page} pageCount={data.pageCount} />
