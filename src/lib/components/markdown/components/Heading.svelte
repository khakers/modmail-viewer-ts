<script lang="ts">
	import type { Tokens } from 'marked';
	import type { Snippet } from 'svelte';

	let { children, node }: { children: Snippet, node: Tokens.Heading } = $props();

	const elements = {
		1: { element: 'h1', class: 'scroll-m-20 text-3xl font-bold tracking-tight' },
		2: { element: 'h2', class: 'scroll-m-20 text-2xl font-bold tracking-tight' },
		3: { element: 'h3', class: 'scroll-m-20 text-xl font-semibold tracking-tight' }
	};

</script>

{#if node.depth in elements}
	<svelte:element this={elements[node.depth].element} class={elements[node.depth].class+'scroll-m-20 mb-2 mt-4'}>
		{@render children()}
	</svelte:element>
{/if}


<style>

</style>