<script lang="ts">
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import type { ComponentProps } from 'svelte';
	import { m } from '$lib/paraglide/messages';
	import NavMain from './nav-main.svelte';
	import NavUser from './nav-user.svelte';
	import type { TenantInfo, User } from './nav';
	import TenantSwitcher from './tenant-switcher.svelte';
	import ThemeSelector from './theme-selector.svelte';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import Inbox from '@lucide/svelte/icons/inbox';

	// TODO move routes to easier to find place
	// could be prerendered remote query
	const data = $derived({
		navMain: [
			// {
			// 	title: m.deft_equal_shark_pat(),
			// 	url: resolve('/(authenticated)/[[tenant]]/logs/dashboard', { tenant: page.params.tenant }),
			// 	icon: ChartColumn
			// },
			{
				title: m.merry_knotty_loris_cure(),
				url: resolve('/(authenticated)/[[tenant]]/logs', { tenant: page.params.tenant }),
				icon: Inbox,
				items: [
					{
						title: m.tidy_such_rabbit_push(),
						url:
							resolve('/(authenticated)/[[tenant]]/logs', {
								tenant: page.params.tenant
							}) + '?status=all'
					},
					{
						title: m.fancy_inclusive_capybara_read(),
						url:
							resolve('/(authenticated)/[[tenant]]/logs', {
								tenant: page.params.tenant
							}) + '?status=open'
					},
					{
						title: m.next_smug_bumblebee_pick(),
						url:
							resolve('/(authenticated)/[[tenant]]/logs', {
								tenant: page.params.tenant
							}) + '?status=closed'
					}
				]
			}
		]
	});

	let {
		ref = $bindable(null),
		collapsible = 'icon',
		user,
		tenants,
		currentTenant,
		...restProps
	}: ComponentProps<typeof Sidebar.Root> & {
		user: User;
		tenants: TenantInfo[];
		currentTenant?: string;
	} = $props();

	$inspect(tenants).with(console.trace);
	$inspect(currentTenant).with(console.trace);
</script>

<Sidebar.Root bind:ref {collapsible} {...restProps}>
	{#if tenants && currentTenant && tenants.length > 0}
		<Sidebar.Header>
			<TenantSwitcher {tenants} {currentTenant} />
		</Sidebar.Header>
	{/if}

	<Sidebar.Content>
		<NavMain items={data.navMain} />
	</Sidebar.Content>
	<Sidebar.Footer>
		<ThemeSelector />
		<NavUser {user} />
	</Sidebar.Footer>
	<Sidebar.Rail />
</Sidebar.Root>
