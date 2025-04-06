<script lang="ts">
	import { type Tokens } from 'marked';
	import type { Snippet } from 'svelte';

	let { children, node }: { children: Snippet; node: Tokens.Link } = $props();
</script>

<a href={node.href} class="text-blue-400 hover:underline" target="_blank" rel="noopener noreferrer">
	{@render children()}
</a>

<style>
</style>
