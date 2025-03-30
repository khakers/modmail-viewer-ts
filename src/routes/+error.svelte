<script lang="ts">
	import { page } from '$app/state';
	import { m } from '$lib/paraglide/messages';
</script>

<div class="flex h-screen flex-col items-center justify-center">
	<h1 class="text-2xl">{m.slimy_misty_bumblebee_loop()}</h1>
	<h2 class="font-mono text-2xl">{page.status}</h2>
	<p>{page.error?.message}</p>
	<h3 class="text-xl">{m.icy_yummy_panther_explore()}</h3>
	<span><code class="font-mono">{page.error?.requestId}</code></span>
</div>
