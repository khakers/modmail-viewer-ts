<script lang="ts">
	import type { Snippet } from 'svelte';

	let { children }: { children: Snippet } = $props();
</script>

<!-- ul children of this element should have ml-1 -->
<ul class="list-inside list-disc [&>li]:leading-tight foo [&_ul]:ml-1 [&_ul]:list-[circle]">
	{@render children()}
</ul>

<style>
</style>
