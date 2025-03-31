<script lang="ts">
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import type { ComponentProps } from 'svelte';
	import { m } from '$lib/paraglide/messages';
	import NavMain from './nav-main.svelte';
	import NavUser from './nav-user.svelte';
	import type { TenantInfo, User } from './nav';
	import TenantSwitcher from './tenant-switcher.svelte';
	import ThemeSelector from './theme-selector.svelte';
	import { resolveRoute } from '$app/paths';
	import { page } from '$app/state';
	import ChartPie from '@lucide/svelte/icons/chart-pie';
	import Frame from '@lucide/svelte/icons/frame';
	import Map from '@lucide/svelte/icons/map';
	import Inbox from '@lucide/svelte/icons/inbox';
	import ChartColumn from '@lucide/svelte/icons/chart-column';

	const data = $derived({
		navMain: [
			{
				title: m.deft_equal_shark_pat(),
				url: resolveRoute('/[[tenant]]/logs/dashboard', { tenant: page.params.tenant }),
				icon: ChartColumn
			},
			{
				title: m.merry_knotty_loris_cure(),
				url: resolveRoute('/[[tenant]]/logs', { tenant: page.params.tenant }),
				icon: Inbox
			}
		],
		projects: [
			{
				name: 'Design Engineering',
				url: '#',
				icon: Frame
			},
			{
				name: 'Sales & Marketing',
				url: '#',
				icon: ChartPie
			},
			{
				name: 'Travel',
				url: '#',
				icon: Map
			}
		]
	});

	let {
		ref = $bindable(null),
		collapsible = 'icon',
		user,
		tenants,
		...restProps
	}: ComponentProps<typeof Sidebar.Root> & {
		user: User;
		tenants: TenantInfo[];
	} = $props();
</script>

<Sidebar.Root bind:ref {collapsible} {...restProps}>
	<Sidebar.Header>
		<TenantSwitcher {tenants} />
	</Sidebar.Header>
	<Sidebar.Content>
		<NavMain items={data.navMain} />
		<!-- <NavProjects projects={data.projects} /> -->
	</Sidebar.Content>
	<Sidebar.Footer>
		<ThemeSelector />
		<NavUser {user} />
	</Sidebar.Footer>
	<Sidebar.Rail />
</Sidebar.Root>
