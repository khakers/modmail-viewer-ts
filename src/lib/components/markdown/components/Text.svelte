<script lang="ts">
	import type { Tokens } from 'marked';

	let { node }: { node: Tokens.Text } = $props();

</script>

{node.text}

<style>
</style>
