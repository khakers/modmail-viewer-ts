<script lang="ts">
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import { useSidebar } from '$lib/components/ui/sidebar/index.js';
	import ChevronsUpDown from '@lucide/svelte/icons/chevrons-up-down';
	import type { TenantInfo } from './nav';
	import { m } from '$lib/paraglide/messages';
	import { resolveRoute } from '$app/paths';
	import { goto, preloadData } from '$app/navigation';
	import GuildAvatar from '../guild-avatar.svelte';
	import { blur } from 'svelte/transition';
	import { Skeleton } from '../ui/skeleton';

	let {
		tenants: tenants,
		currentTenant: selectedTenant = $bindable()
	}: {
		tenants: TenantInfo[];
		currentTenant?: string;
	} = $props();
	const sidebar = useSidebar();
	$inspect(selectedTenant);
	let activeTeam: TenantInfo | undefined = $derived(
		tenants.find((tenant) => {
			// Find the active tenant based on the current page route
			return tenant.tenant.slug === selectedTenant;
		}) || tenants[0]
	);
</script>

<div class="tenant-switcher">
	<Sidebar.Menu class="tenant-switcher">
		<Sidebar.MenuItem>
			<DropdownMenu.Root>
				<DropdownMenu.Trigger>
					{#snippet child({ props })}
						<Sidebar.MenuButton
							{...props}
							size="lg"
							class="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
						>
							<div
								class="text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg"
							>
								{#if activeTeam}
									<GuildAvatar guild={activeTeam.guild} />
								{:else}
									<div
										class="bg-sidebar-primary relative flex size-10 shrink-0 overflow-hidden rounded-full"
									></div>
								{/if}
							</div>
							<div class="grid flex-1 text-left text-sm leading-tight">
								<div class="@container h-4">
									{#if activeTeam}
										{#key activeTeam.tenant.name}
											<span class="truncate font-semibold @[140px]:absolute">
												{activeTeam.tenant.name}
											</span>
										{/key}
									{:else}
										<span class="truncate font-semibold @[140px]:absolute">
											<Skeleton class="h-[20px] w-[100px] rounded-full" />
										</span>
									{/if}
								</div>
								<div class="@container h-4">
									{#if activeTeam}
										{#key activeTeam.tenant.permissionLevel}
											<span
												class="truncate text-xs lowercase @[140px]:absolute"
											>
												{activeTeam.tenant.permissionLevel}
											</span>
										{/key}
									{:else}
										None
									{/if}
								</div>
							</div>
							<ChevronsUpDown class="ml-auto" />
						</Sidebar.MenuButton>
					{/snippet}
				</DropdownMenu.Trigger>
				<DropdownMenu.Content
					class="w-(--bits-dropdown-menu-anchor-width) min-w-56 rounded-lg"
					align="start"
					side={sidebar.isMobile ? 'bottom' : 'right'}
					sideOffset={4}
				>
					<DropdownMenu.Label class="text-muted-foreground text-xs">
						{m.crazy_known_fireant_talk()}
					</DropdownMenu.Label>
					{#each tenants as tenant, index (tenant.tenant.slug)}
						<DropdownMenu.Item
							onSelect={() =>
								goto(
									resolveRoute('/[[tenant]]/logs/', {
										tenant: tenant.tenant.slug
									})
								)}
							class="gap-2 p-2"
							onmouseover={() =>
								preloadData(
									resolveRoute('/[[tenant]]/logs/', {
										tenant: tenant.tenant.slug
									})
								)}
						>
							<!-- <a href={resolveRoute(page.route.id, {...page.params, slug: tenant.tenant.slug})}> -->
							<div class="flex size-6 items-center justify-center rounded-sm">
								{#key tenant.guild?.icon}
									<div class="avatar">
										<GuildAvatar guild={tenant.guild} class="size-7" />
									</div>
								{/key}
							</div>
							{tenant.tenant.name}
						</DropdownMenu.Item>
					{:else}
						<DropdownMenu.Label>
							{m.dry_early_grizzly_bubble()}
						</DropdownMenu.Label>
					{/each}
				</DropdownMenu.Content>
			</DropdownMenu.Root>
		</Sidebar.MenuItem>
	</Sidebar.Menu>
</div>

<style>
	.tenant-switcher {
		view-transition-name: tenant-switcher;
	}

	.tenant-switcher  .avatar {
		view-transition-name: tenant-switcher-avatar;
	}
</style>
