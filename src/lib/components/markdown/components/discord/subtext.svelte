<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { Tokens } from 'marked';

	let { children, node }: { children: Snippet, node: Tokens.Code } = $props();

</script>

<small>
	<span class="text-muted-foreground">
		{@render children()}
	</span>
</small>

<style>

</style>