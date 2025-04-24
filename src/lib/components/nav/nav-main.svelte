<script lang="ts">
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import { m } from '$lib/paraglide/messages';
	import type { Component } from 'svelte';
	import * as Collapsible from '../ui/collapsible';
	import { ChevronRight } from '@lucide/svelte';

	let {
		items
	}: {
		items: {
			title: string;
			url: string;
			icon?: Component;
			isActive?: boolean;
			items?: {
				title: string;
				url: string;
			}[];
		}[];
	} = $props();

	let clientWidth: number = $state(50);
</script>

<Sidebar.Group>
	<Sidebar.GroupLabel>{m.loud_sound_seal_cheer()}</Sidebar.GroupLabel>
	<Sidebar.Menu>
		<div bind:clientWidth>
			{#each items as mainItem (mainItem.title)}
				<!-- Swap out collapsible for simple anchor link when the width is too swall for it to work -->
				{#if mainItem.items && clientWidth >= 35}
					<Collapsible.Root open={mainItem.isActive} class="group/collapsible">
						{#snippet child({ props })}
							<Sidebar.MenuItem {...props}>
								<Collapsible.Trigger>
									{#snippet child({ props })}
										<Sidebar.MenuButton {...props}>
											{#snippet tooltipContent()}
												{mainItem.title}
											{/snippet}
											{#if mainItem.icon}
												<mainItem.icon />
											{/if}
											<span>{mainItem.title}</span>
											<ChevronRight
												class="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90"
											/>
										</Sidebar.MenuButton>
									{/snippet}
								</Collapsible.Trigger>
								<Collapsible.Content>
									{#if mainItem.items}
										<Sidebar.MenuSub>
											{#each mainItem.items as subItem (subItem.title)}
												<Sidebar.MenuSubItem>
													<Sidebar.MenuSubButton>
														{#snippet child({ props })}
															<a href={subItem.url} {...props}>
																<span>{subItem.title}</span>
															</a>
														{/snippet}
													</Sidebar.MenuSubButton>
												</Sidebar.MenuSubItem>
											{/each}
										</Sidebar.MenuSub>
									{/if}
								</Collapsible.Content>
							</Sidebar.MenuItem>
						{/snippet}
					</Collapsible.Root>
				{:else}
					<Sidebar.MenuItem>
						<Sidebar.MenuButton>
							{#snippet tooltipContent()}
								{mainItem.title}
							{/snippet}
							{#snippet child({ props })}
								<a href={mainItem.url} {...props}>
									<mainItem.icon />
									<span>{mainItem.title}</span>
								</a>
							{/snippet}
						</Sidebar.MenuButton>
					</Sidebar.MenuItem>
				{/if}
			{/each}
		</div>
	</Sidebar.Menu>
</Sidebar.Group>
