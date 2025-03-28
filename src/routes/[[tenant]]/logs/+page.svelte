<script lang="ts">
	import { page } from '$app/state';
	import type { PageData } from './$types';
	import { resolveRoute } from '$app/paths';

	let { data }: { data: PageData } = $props();
	// console.log(data);
</script>

<div data-sveltekit-preload-code>
	{#each data.threads as thread (thread._id)}
		<div>
			<h2 class="text-2xl">
				<a
					aria-label="modmail thread"
					href={resolveRoute('/[[tenant]]/logs/[id]', {
						tenant: page.params.tenant,
						id: thread._id
					})}>{thread._id}</a
				>
			</h2>
			<time datetime={thread.created_at}>{thread.created_at}</time>
			{thread.messages.length}
		</div>
	{:else}
		<p>No threads found.</p>
	{/each}
</div>
