<script lang="ts">
	import type { Snippet } from 'svelte';

	let { children }: { children: Snippet } = $props();

</script>

<u class="underline">
	{@render children()}
</u>

<style>

</style>