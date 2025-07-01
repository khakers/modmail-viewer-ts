<script lang="ts">
	import { Button } from './ui/button';
	import ChevronLeft from '@lucide/svelte/icons/chevron-left';
	import { m } from '$lib/paraglide/messages';
	import ChevronRight from '@lucide/svelte/icons/chevron-right';
	import { page } from '$app/state';
	import { param } from 'drizzle-orm';

	let { index, pageCount }: { index: number; pageCount: number } = $props();

	function urlForPage(index: number | undefined, url: URL) {
		if (index == undefined) return undefined;
		url.searchParams.set('page', index.toString());
		return url.toString();
	}

	const previousPage = $derived(index === 1 ? undefined : index - 1);
	const nextPage = $derived(index === pageCount ? undefined : index + 1);

	const nextPageUrl = $derived(urlForPage(nextPage, page.url));

	const previousPageUrl = $derived(urlForPage(previousPage, page.url));
</script>

<div class="flex justify-center paginator">
	<div class="bg-primary-foreground flex items-center rounded-md">
		<Button variant="link" disabled={index === 1} href={previousPageUrl}>
			<ChevronLeft />
			{m.ideal_cuddly_manatee_revive()}
		</Button>
		<span class="border-muted-foreground rounded-md border px-1">
			{index} / {pageCount}
		</span>
		<Button variant="link" disabled={index === pageCount} href={nextPageUrl}>
			{m.gray_topical_frog_comfort()}
			<ChevronRight />
		</Button>
	</div>
</div>

<style>
	.paginator {
		view-transition-name: paginator;
	}
</style>
