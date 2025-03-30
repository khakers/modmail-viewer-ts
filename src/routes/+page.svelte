<script lang="ts">
	import { resolveRoute } from '$app/paths';
	import type { PageData } from './$types';

	const { data }: { data: PageData } = $props();
</script>

<h1>Modmail-Viewer-ts</h1>
<p>Modmail-Viewer-ts is a tool to view Discord Modmail historical threads.</p>
<h2>Your Modmail instances</h2>
<ul>
	{#each data.tenants as tenant, i (tenant.id)}
		<li>
			<h2><a href={resolveRoute('/[[tenant]]/logs', {tenant: tenant.slug})}>{tenant.name}</a></h2>
		</li>
	{/each}
</ul>
<!-- <pre>
{JSON.stringify(data, null, 2)}
</pre> -->
