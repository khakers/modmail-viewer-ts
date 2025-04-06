<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { Tokens } from 'marked';

	let { children, node }: { children: Snippet; node: Tokens.Codespan } = $props();

</script>

<span class="border rounded-md bg-primary-foreground px-1 py-0.5 text-sm font-mono text-primary">
  <code>
  {node.text}
  </code>
</span>

<style>

</style>