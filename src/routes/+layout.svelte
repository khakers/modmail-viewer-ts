<script lang="ts">
	import '../app.css';
	import type { LayoutProps } from './$types';

	let { data, children }: LayoutProps = $props();
</script>
<div class="flex flex-col">
	<span class="self-end">
		Discord ID:
		{data.session.discordUserId}
	</span>
</div>
{@render children()}
