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
	import { invalidate, onNavigate } from '$app/navigation';
	import { Skeleton } from '$lib/components/ui/skeleton';

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
	const currentTenant = $derived(
		page.params.tenant !== undefined ? page.params.tenant : data.currentTenant
	);

	onNavigate((navigation) => {
		if (!document.startViewTransition) return;

		return new Promise((resolve) => {
			document.startViewTransition(async () => {
				resolve();
				await navigation.complete;
			});
		});
	});
</script>

<Sidebar.Provider>
	<AppSidebar
		{user}
		tenants={data.tenantInfo}
		{currentTenant}
		style={'view-transition-name: sidebar;'}
	/>
	<Sidebar.Inset>
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
									{:else}
										<Skeleton class="h-4 w-16 rounded-full" />
									{/if}
								</Breadcrumb.Item>
								<Breadcrumb.Separator class="hidden md:block" />
								<Breadcrumb.Item class="hidden md:block">
									{#if page.route.id !== '/(authenticated)/[[tenant]]/logs'}
										<Breadcrumb.Link
											data-sveltekit-preload-data="hover"
											href={resolveRoute('/[[tenant]]/logs', {
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
			<div>
				<Button variant="ghost" onclick={() => invalidate(page.url)}><RefreshCcw /></Button>
			</div>
		</header>
		<div class="flex max-w-dvw flex-1 flex-col gap-4 p-4 pt-0">
			{@render children()}
		</div>
	</Sidebar.Inset>
</Sidebar.Provider>

<style>
	@keyframes fade-in {
		from {
			opacity: 0;
		}
	}

	@keyframes fade-out {
		to {
			opacity: 0;
		}
	}

	@keyframes slide-from-right {
		from {
			transform: translateX(30px);
		}
	}

	@keyframes slide-to-left {
		to {
			transform: translateX(-30px);
		}
	}
	@media (prefers-reduced-motion) {
		::view-transition-group(*),
		::view-transition-old(*),
		::view-transition-new(*) {
			animation: none !important;
		}
	}

	:root::view-transition-old(root) {
		animation:
			90ms cubic-bezier(0.4, 0, 1, 1) both fade-out,
			300ms cubic-bezier(0.4, 0, 0.2, 1) both slide-to-left;
	}

	:root::view-transition-new(root) {
		animation:
			210ms cubic-bezier(0, 0, 0.2, 1) 90ms both fade-in,
			300ms cubic-bezier(0.4, 0, 0.2, 1) both slide-from-right;
	}

	header {
		view-transition-name: header;
	}

	li[aria-current='page']::before {
		/* other existing rules */
		view-transition-name: active-page;
	}
</style>
