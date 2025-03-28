<script lang="ts">
	import type { PageData } from './$types';

	const { data }: { data: PageData } = $props();
	console.log(data);
</script>

<!-- <pre class="font-mono">
    <code>
        {EJSON.stringify(data.document, {}, 4)}
    </code>
</pre> -->

<h1>{data.document._id}</h1>
<time datetime={data.document.created_at}>{data.document.created_at}</time>
<h2>Messages</h2>

{#each data.document.messages as message (message.message_id)}
	<div>
		<span class="text-2xl">{message.author.name}</span>
		<time datetime={message.timestamp}>{message.timestamp}</time>
	</div>
	<p>
		{message.content}
	</p>
{/each}
