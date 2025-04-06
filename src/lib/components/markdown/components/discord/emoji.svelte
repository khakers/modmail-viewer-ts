<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		children,
		node
	}: {
		children: Snippet;
		node: {
			type: string;
			[key: string]: any;
		} & {
			animated: boolean;
			name: string;
			id: string;
		};
	} = $props();
</script>

<span class="inline-flex h-6 w-6 align-text-bottom">
	<img src={`https://cdn.discordapp.com/emojis/${node.id}.webp?size=44`} alt={':'+node.name+':'} loading="lazy" />
</span>

<style>
</style>
