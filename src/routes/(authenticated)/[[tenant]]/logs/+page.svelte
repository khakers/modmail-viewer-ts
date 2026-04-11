<script lang="ts">
	import type { PageData } from './$types';
	import * as Table from '$lib/components/ui/table';
	import { m } from '$lib/paraglide/messages';
	import HoverDate from '$lib/components/hover-date.svelte';
	import UserAvatar from '$lib/components/user-avatar.svelte';
	import Paginator from '$lib/components/paginator.svelte';
	import { urlWithSearchParams } from '$lib/searchParamUtils';
	import { page } from '$app/state';
	import ProfilePopout from '$lib/components/modmail/profile-hover-card.svelte';
	import ThreadStatusBadge from '$lib/components/modmail/thread-status-badge.svelte';
	import ThreadHoverCard from '$lib/components/modmail/thread-hover-card.svelte';

	let { data }: { data: PageData } = $props();

	let uid = $props.id();

	// $inspect(data);
</script>

<header class="flex flex-row items-baseline gap-8">
	<h2 class="text-xl">{m.jumpy_careful_iguana_wave()}</h2>
	<div
		class="bg-muted text-muted-foreground inline-flex h-10 items-center justify-center rounded-md p-1"
	>
		<a
			class="ring-offset-background focus-visible:ring-ring data-[state=active]:bg-background data-[state=active]:text-foreground inline-flex items-center justify-center rounded-sm px-3 py-1.5 text-sm font-medium whitespace-nowrap transition-all focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-hidden disabled:pointer-events-none disabled:opacity-50 data-[state=active]:shadow-xs"
			href={urlWithSearchParams(page.url, [['status', 'all']])}
			data-state={data.statusFilter === 'all' ? 'active' : 'inactive'}
		>
			{m.zesty_royal_pig_thrive()}
		</a>
		<a
			class="ring-offset-background focus-visible:ring-ring data-[state=active]:bg-background data-[state=active]:text-foreground inline-flex items-center justify-center rounded-sm px-3 py-1.5 text-sm font-medium whitespace-nowrap transition-all focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-hidden disabled:pointer-events-none disabled:opacity-50 data-[state=active]:shadow-xs"
			href={urlWithSearchParams(page.url, [['status', 'open']])}
			data-state={data.statusFilter === 'open' ? 'active' : 'inactive'}
		>
			{m.round_cuddly_gazelle_transform()}
		</a>
		<a
			class="ring-offset-background focus-visible:ring-ring data-[state=active]:bg-background data-[state=active]:text-foreground inline-flex items-center justify-center rounded-sm px-3 py-1.5 text-sm font-medium whitespace-nowrap transition-all focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-hidden disabled:pointer-events-none disabled:opacity-50 data-[state=active]:shadow-xs"
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
</header>
<div class="w-full overflow-auto">
	<Table.Root>
		<Table.Caption>{m.merry_aloof_goat_fond()}</Table.Caption>
		<Table.Header style="view-transition-name: log-table-header">
			<Table.Row>
				<Table.Head class="w-25">{m.sharp_these_pug_transform()}</Table.Head>
				<Table.Head>{m.weary_tough_otter_fall()}</Table.Head>
				<Table.Head>{m.plane_petty_impala_buy()}</Table.Head>
				<Table.Head>Creator</Table.Head>
				<Table.Head>{m.fuzzy_lazy_bee_list()}</Table.Head>
				<Table.Head>{m.frail_swift_elk_hurl()}</Table.Head>
				<Table.Head>{m.every_day_duck_rest()}</Table.Head>
			</Table.Row>
		</Table.Header>
		<Table.Body class="table-body">
			{#each data.threads as thread (thread._id)}
				<!-- Display the recipient if the recipient is different than the creator -->
				<Table.Row>
					<Table.Cell class="font-medium">
						<ThreadHoverCard {thread} />
					</Table.Cell>
					<Table.Cell>
						<ThreadStatusBadge {thread} transitionId={thread._id ?? uid} />
					</Table.Cell>
					<Table.Cell>
						<ProfilePopout user={thread.creator}>
							<div class="flex flex-row items-center gap-2">
								<UserAvatar user={thread.recipient} class="size-6" />
								{thread.recipient.name}
							</div>
						</ProfilePopout>
					</Table.Cell>
					<Table.Cell>
						<ProfilePopout user={thread.creator}>
							<div class="flex flex-row items-center gap-2">
								<UserAvatar user={thread.creator} class="size-6" />
								{thread.creator.name}
							</div>
						</ProfilePopout>
					</Table.Cell>
					<Table.Cell class="max-w-64 truncate">
						{#if thread.messages[0]?.content}
							{thread.messages[0].content}
						{:else}
							<span class="text-muted-foreground">
								{m.seemly_next_blackbird_dig()}
							</span>
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

<style>
	.table-body {
		view-transition-name: logs-list-table-body;
	}
	header {
		view-transition-name: logs-list-header;
	}
</style>
