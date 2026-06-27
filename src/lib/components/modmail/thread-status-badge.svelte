<script lang="ts">
	import { m } from '$lib/paraglide/messages';
	import { CircleCheck, CircleDot } from '@lucide/svelte';
	import { Badge } from '../ui/badge';

	let { thread, transitionId }: { thread: {_id: string, open?: boolean}; transitionId: string } = $props();

	let transitionName = $derived(`log-${thread._id ?? transitionId}-badge`);
</script>

{#if thread.open}
	<Badge class="w-20 justify-start" style={`view-transition-name: ${transitionName};`}>
		<CircleDot class="me-1 h-4" />{m.deft_wild_platypus_peel()}
	</Badge>
{:else}
	<Badge variant="secondary" class="w-20 justify-start" style={`view-transition-name: ${transitionName};`}>
		<CircleCheck class="me-1 h-4" />
		{m.gross_sharp_nuthatch_bloom()}
	</Badge>
{/if}

<style>
</style>
