<script lang="ts">
	import { m } from '$lib/paraglide/messages';
	import { CircleCheck, CircleDot } from '@lucide/svelte';
	import { Badge } from '../ui/badge';
	import type { ModmailThread } from '$lib/modmail';

	let { thread, transitionId }: { thread: ModmailThread; transitionId: string } = $props();
</script>

{#if thread.open}
	<Badge class="w-20 justify-start" style={`view-transition-name: log-${thread._id ?? transitionId}-badge;`}>
		<CircleDot class="me-1 h-4" />{m.deft_wild_platypus_peel()}
	</Badge>
{:else}
	<Badge variant="secondary" class="w-20 justify-start" style={`view-transition-name: log-${thread._id ?? transitionId}-badge;`}>
		<CircleCheck class="me-1 h-4" />
		{m.gross_sharp_nuthatch_bloom()}
	</Badge>
{/if}

<style>
</style>
