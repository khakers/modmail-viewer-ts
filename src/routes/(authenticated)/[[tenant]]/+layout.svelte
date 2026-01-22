<script lang="ts">
	import * as Breadcrumb from '$lib/components/ui/breadcrumb/index.js';
	import { Separator } from '$lib/components/ui/separator/index.js';
	import { m } from '$lib/paraglide/messages';
	import { Button } from '$lib/components/ui/button';
	import RefreshCcw from '@lucide/svelte/icons/refresh-ccw';
	import { Skeleton } from '$lib/components/ui/skeleton';
	import AppSidebar from '$lib/components/nav/app-sidebar.svelte';
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';

	import type { LayoutProps } from './$types';
	import { page } from '$app/state';
	import { resolve } from '$app/paths';
	import { invalidate } from '$app/navigation';

	let { data, children }: LayoutProps = $props();
</script>

<header
	class="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12"
>
	<div class="flex items-center gap-2 px-4">
		<Sidebar.Trigger class="-ml-1" />
		<Separator orientation="vertical" class="mr-2 h-4" />
		{#if page.route.id?.startsWith('/(authenticated)/[[tenant]]')}
			<Breadcrumb.Root>
				<Breadcrumb.List>
					{#if page.route.id === '/(authenticated)/[[tenant]]'}
						<Breadcrumb.Item class="hidden md:block">Tenants</Breadcrumb.Item>
					{:else}
						<Breadcrumb.Item class="hidden md:block">
							{#if data.currentTenant}
								{data.currentTenant}
							{/if}
						</Breadcrumb.Item>
						<Breadcrumb.Separator class="hidden md:block" />
						<Breadcrumb.Item class="hidden md:block">
							{#if page.route.id !== '/(authenticated)/[[tenant]]/logs'}
								<Breadcrumb.Link
									data-sveltekit-preload-data="hover"
									href={resolve('/(authenticated)/[[tenant]]/logs', {
										tenant: page.params.tenant
									})}
								>
									{m.active_late_lemming_feast()}
								</Breadcrumb.Link>
							{:else}
								<Breadcrumb.Page>
									{m.active_late_lemming_feast()}</Breadcrumb.Page
								>
							{/if}
						</Breadcrumb.Item>
						{#if page.route.id === '/(authenticated)/[[tenant]]/logs/[id]'}
							<Breadcrumb.Separator class="hidden md:block" />
							<Breadcrumb.Item>
								<Breadcrumb.Page>{page.params.id}</Breadcrumb.Page>
							</Breadcrumb.Item>
						{/if}
					{/if}
				</Breadcrumb.List>
			</Breadcrumb.Root>
		{/if}
	</div>
	<!-- <div>
		<Button variant="ghost" onclick={() => invalidate(page.url)}><RefreshCcw /></Button>
	</div> -->
</header>
<div class="flex max-w-dvw flex-1 flex-col gap-4 p-4 pt-0">
	{@render children()}
</div>
