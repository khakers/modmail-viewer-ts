<script lang="ts">
	import { onMount, type Snippet } from 'svelte';
	import type { Tokens } from 'marked';
	import hljs from 'highlight.js';
	import { mode } from 'mode-watcher';

	let { children, node }: { children: Snippet; node: Tokens.Code } = $props();

	// const options = $derived(node.lang !== undefined ? {language:node.lang}: {});

	const highlighted = $derived(
		node.lang !== undefined && node.lang !== ''
			? hljs.highlight(node.text, { language: node.lang })
			: hljs.highlightAuto(node.text)
	);

	// TODO choose more accurate themes or create a custom theme
	onMount(async () => {
		if ($mode === 'dark') {
			await import('highlight.js/styles/base16/google-dark.css');
		} else {
			await import('highlight.js/styles/base16/google-light.css');
		}
	});
</script>

<pre class="rounded-lg border bg-primary-foreground ps-2"><code>{@html highlighted.value}</code
	></pre>

<style>
</style>
