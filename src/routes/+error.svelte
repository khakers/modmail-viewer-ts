<script lang="ts">
	import { page } from '$app/state';
	import { m } from '$lib/paraglide/messages';
</script>

<div class="flex h-screen flex-col items-center justify-center">
	<h1>{m.slimy_misty_bumblebee_loop()}</h1>
	<h2>{page.status}: {page.error?.message}</h2>
</div>
