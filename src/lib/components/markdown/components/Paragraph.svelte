<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { Tokens } from 'marked';

	let { children, node }: { children: Snippet; node: Tokens.Paragraph } = $props();
</script>

<div>
	{@render children()}
</div>

<style>
</style>
