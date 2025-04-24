<script lang="ts">
	import type { LayoutProps } from './$types';
	import * as Breadcrumb from '$lib/components/ui/breadcrumb/index.js';
	import { Separator } from '$lib/components/ui/separator/index.js';
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import AppSidebar from '$lib/components/nav/app-sidebar.svelte';
	import { resolveRoute } from '$app/paths';
	import { page } from '$app/state';
	import { m } from '$lib/paraglide/messages';
	import { Button } from '$lib/components/ui/button';
	import RefreshCcw from '@lucide/svelte/icons/refresh-ccw';
	import { invalidate } from '$app/navigation';

	let { data, children }: LayoutProps = $props();
	$inspect(data);
	const avatar = $derived(
		data.user.avatar !== undefined
			? data.user.avatar
			: `https://cdn.discordapp.com/embed/avatars/${(Number.parseInt(data.user.discordUserId) >> 22) % 6}.png`
	);
	$inspect(avatar);
	const user = $derived({
		uid: data.user.discordUserId,
		name: data.user.username,
		avatar
	});
	$inspect(page.route.id);

	// If the tenant param is undefined the only way we can know it is via the data, but changing via the selector may not update the layout 
	const currentTenant = $derived(page.params.tenant !== undefined ? page.params.tenant : data.currentTenant)
</script>

<Sidebar.Provider>
	<AppSidebar {user} tenants={data.tenantInfo} currentTenant={currentTenant} />
	<Sidebar.Inset>
		<header
			class="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12"
		>
			<div class="flex items-center gap-2 px-4">
				<Sidebar.Trigger class="-ml-1" />
				<Separator orientation="vertical" class="mr-2 h-4" />
				<Breadcrumb.Root>
					<Breadcrumb.List>
						{#if page.route.id === '/(authenticated)/[[tenant]]'}
							<Breadcrumb.Item class="hidden md:block">Tenants</Breadcrumb.Item>
						{:else}
							<Breadcrumb.Item class="hidden md:block">
								{page.params.tenant}
							</Breadcrumb.Item>
							<Breadcrumb.Separator class="hidden md:block" />
							<Breadcrumb.Item class="hidden md:block">
								{#if page.route.id !== '/(authenticated)/[[tenant]]/logs'}
									<Breadcrumb.Link
										data-sveltekit-preload-data="hover"
										href={resolveRoute('/[[tenant]]/logs', { tenant: page.params.tenant })}
									>
										{m.active_late_lemming_feast()}
									</Breadcrumb.Link>
								{:else}
									<Breadcrumb.Page>{m.active_late_lemming_feast()}</Breadcrumb.Page>
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
			</div>
			<div>
				<Button variant="ghost" onclick={()=>invalidate(page.url)}><RefreshCcw /></Button>
			</div>
		</header>
		<div class="flex flex-1 flex-col gap-4 p-4 pt-0 max-w-[100dvw]">
			{@render children()}
		</div>
	</Sidebar.Inset>
</Sidebar.Provider>
