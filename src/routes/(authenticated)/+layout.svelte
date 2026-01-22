<script lang="ts">
	import type { LayoutProps } from './$types';
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import AppSidebar from '$lib/components/nav/app-sidebar.svelte';
	import { page } from '$app/state';
	import { onNavigate } from '$app/navigation';

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
		{@render children()}
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
