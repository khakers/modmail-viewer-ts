<script lang="ts">
	import { resolve, resolveRoute } from '$app/paths';
	import type { PageData } from './$types';
	import * as Card from '$lib/components/ui/card/index.js';
	import { m } from '$lib/paraglide/messages';

	const { data }: { data: PageData } = $props();
</script>

<h2 class="text-2xl font-medium">{m.sleek_wild_okapi_nourish()}</h2>
<ul class="grid grid-cols-1 gap-4">
	{#each data.tenants as tenant (tenant.id)}
		<li>
			<Card.Root>
				<Card.Header>
					<Card.Title
						><a href={resolve('/(authenticated)/[[tenant]]/logs', { tenant: tenant.slug })}>{tenant.name}</a
						></Card.Title
					>
					<Card.Description>{tenant.description}</Card.Description>
				</Card.Header>
				<Card.Content>
					<!-- TODO finish tenant cards -->
				</Card.Content>
			</Card.Root>
		</li>
	{:else}
		<div>
			<p class="text-muted-foreground">{m.quiet_fit_wolf_pull()}</p>
		</div>
	{/each}
</ul>
