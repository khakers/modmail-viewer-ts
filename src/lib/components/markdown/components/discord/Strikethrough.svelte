<script lang="ts">
	import type { Snippet } from 'svelte';

	let { children }: { children: Snippet } = $props();

</script>

<del class="">
	{@render children()}
</del>

<style>

</style>