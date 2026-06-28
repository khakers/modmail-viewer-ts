<script lang="ts">
	import type { Tokens } from 'marked';
	import hljs from 'highlight.js';
	import '$lib/assets/highlightjs-vars.css';

	let { node }: { node: Tokens.Code } = $props();

	const highlighted = $derived(
		node.lang !== undefined && node.lang !== ''
			? hljs.highlight(node.text, { language: node.lang })
			: hljs.highlightAuto(node.text)
	);

	// TODO choose more accurate themes or create a custom theme
</script>

<!-- the formatting is required for the element to display properly and for the eslint disable to work -->
<!-- prettier-ignore-start -->
<!-- eslint-disable-next-line svelte/no-at-html-tags -->
<pre class="rounded-lg border bg-primary-foreground ps-2"><code>{@html highlighted.value}</code></pre>
<!-- prettier-ignore-end -->

<style>
</style>
