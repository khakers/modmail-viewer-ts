<script lang="ts">
	import type { Snippet } from 'svelte';

	let { children }: { children: Snippet } = $props();

	let hidden = $state(true);
</script>

<span
	aria-hidden={hidden}
	class="group aria-hidden:cursor-pointer cursor-text aria-hidden:select-none aria-hidden:bg-primary/80 aria-hidden:hover:bg-primary bg-muted rounded-md"
	onclick={() => (hidden = false)}
	role="button"
>
	<span class="pointer-events-none group-aria-hidden:invisible">{@render children()}</span>
</span>

<style>
</style>
