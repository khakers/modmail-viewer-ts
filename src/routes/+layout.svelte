<script lang="ts">
	import '../app.css';
	import type { LayoutProps } from './$types';

	let { data, children }: LayoutProps = $props();
</script>
<div class="flex flex-col">
	<span class="self-end">
		{data.user.username}
	</span>
</div>

{@render children()}
