<script lang="ts">
	import { type Tokens } from 'marked';
	import { codepointStringFromEmoji } from './tewmoji';

	let {
		node
	}: {
		node: Tokens.Generic & {
			type: 'twemoji';
			name: string;
		};
	} = $props();

	$inspect(node.name.length);
	const codepoint = $derived(codepointStringFromEmoji(node.name));
</script>

<span class="inline-flex h-5 w-5 align-middle">
	<img
		class="inline h-5 w-5"
		src={`https://cdn.jsdelivr.net/gh/jdecked/twemoji@latest/assets/svg/${codepoint}.svg`}
		alt=""
		loading="lazy"
	/>
</span>

<style>
</style>
