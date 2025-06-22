<script lang="ts">
	import { resetMode, setMode, userPrefersMode } from 'mode-watcher';
	import Sun from '@lucide/svelte/icons/sun';
	import Moon from '@lucide/svelte/icons/moon';
	import SunMoon from '@lucide/svelte/icons/sun-moon';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import { useSidebar } from '$lib/components/ui/sidebar/index.js';
	import ChevronsUpDown from '@lucide/svelte/icons/chevrons-up-down';
	import { m } from '$lib/paraglide/messages';

	const sidebar = useSidebar();
</script>

<Sidebar.Menu>
	<Sidebar.MenuItem>
		<DropdownMenu.Root>
			<DropdownMenu.Trigger>
				{#snippet child({ props })}
					<Sidebar.MenuButton
						size="lg"
						class="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
						{...props}
					>
						<div class="flex size-8 shrink-0 items-center justify-center">
							{#if $userPrefersMode === 'light'}
								<Sun class="size-6!" />
							{:else if $userPrefersMode === 'dark'}
								<Moon class="size-6!" />
							{:else}
								<SunMoon class="size-6!" />
							{/if}
						</div>
						<div class="grid flex-1 text-left text-sm leading-tight">
							<span class="truncate">
								{m.that_tense_anteater_peek({ theme: $userPrefersMode })}
								</span>
						</div>
						<ChevronsUpDown class="ml-auto size-4" />
					</Sidebar.MenuButton>
				{/snippet}
			</DropdownMenu.Trigger>
			<DropdownMenu.Content
				class="w-(--bits-dropdown-menu-anchor-width) min-w-56 rounded-lg"
				side={sidebar.isMobile ? 'bottom' : 'right'}
				align="end"
				sideOffset={4}
			>
				<DropdownMenu.Item onclick={() => setMode('light')}>
					<Sun />
					{m.that_tense_anteater_peek({ theme: 'light' })}
				</DropdownMenu.Item>
				<DropdownMenu.Item onclick={() => setMode('dark')}>
					<Moon />
					{m.that_tense_anteater_peek({ theme: 'dark' })}
				</DropdownMenu.Item>
				<DropdownMenu.Item onclick={() => resetMode()}>
					<SunMoon />
					{m.that_tense_anteater_peek({ theme: 'system' })}
				</DropdownMenu.Item>
			</DropdownMenu.Content>
		</DropdownMenu.Root>
	</Sidebar.MenuItem>
</Sidebar.Menu>

<style>
</style>
