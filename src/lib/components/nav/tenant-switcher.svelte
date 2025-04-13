<script lang="ts">
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import { useSidebar } from '$lib/components/ui/sidebar/index.js';
	import ChevronsUpDown from '@lucide/svelte/icons/chevrons-up-down';
	import type { TenantInfo } from './nav';
	import { m } from '$lib/paraglide/messages';
	import { page } from '$app/state';
	import { resolveRoute } from '$app/paths';
	import { goto, preloadData } from '$app/navigation';
	import GuildAvatar from '../guild-avatar.svelte';
	import { blur } from 'svelte/transition';

	let {
		tenants: tenants
	}: {
		tenants: TenantInfo[];
	} = $props();
	const sidebar = useSidebar();

	let activeTeam: TenantInfo | undefined = $derived(
		tenants.find((tenant) => {
			// Find the active tenant based on the current page route
			return tenant.tenant.slug === page.params.tenant;
		}) || tenants[0]
	);
</script>

<Sidebar.Menu>
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
							class="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground"
						>
							{#if activeTeam}
								<GuildAvatar guild={activeTeam.guild} />
							{:else}
								<div class="relative flex size-10 shrink-0 overflow-hidden rounded-full"></div>
							{/if}
						</div>
						<div class="grid flex-1 text-left text-sm leading-tight">
							<div class="h-4 @container">
								{#if activeTeam}
									{#key activeTeam.tenant.name}
										<span
											class="truncate font-semibold @[140px]:absolute"
											transition:blur={{ delay: 0, duration: 250 }}
										>
											{activeTeam.tenant.name}
										</span>
									{/key}
								{:else}
									<span
										class="truncate font-semibold @[140px]:absolute"
										transition:blur={{ delay: 0, duration: 250 }}
									>
										eeeeeeeeeeee
									</span>
								{/if}
							</div>
							<div class="h-4 @container">
								{#if activeTeam}
									{#key activeTeam.tenant.permissionLevel}
										<span
											class="truncate text-xs lowercase @[140px]:absolute"
											transition:blur={{ delay: 0, duration: 250 }}
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
				class="w-[var(--bits-dropdown-menu-anchor-width)] min-w-56 rounded-lg"
				align="start"
				side={sidebar.isMobile ? 'bottom' : 'right'}
				sideOffset={4}
			>
				<DropdownMenu.Label class="text-xs text-muted-foreground"
					>{m.crazy_known_fireant_talk()}</DropdownMenu.Label
				>
				{#each tenants as tenant, index (tenant.tenant.slug)}
					<DropdownMenu.Item
						onSelect={() => goto(resolveRoute('/[[tenant]]/logs/', { tenant: tenant.tenant.slug }))}
						class="gap-2 p-2"
						onmouseover={() =>
							preloadData(resolveRoute('/[[tenant]]/logs/', { tenant: tenant.tenant.slug }))}
					>
						<!-- <a href={resolveRoute(page.route.id, {...page.params, slug: tenant.tenant.slug})}> -->
						<div class="flex size-6 items-center justify-center rounded-sm">
							{#key tenant.guild?.icon}
								<div transition:blur={{ duration: 250 }}>
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
