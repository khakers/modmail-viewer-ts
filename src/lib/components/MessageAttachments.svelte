<script lang="ts">
	import type { Attachment, OpenModmailAttachment } from '$lib/modmail';
	import ImageGallery from './ImageGallery.svelte';

	let { attachments }: { attachments: Attachment[] | OpenModmailAttachment[] } = $props();

	const isOpenModmailAttachment = $derived.by(() => {
		if (attachments.length === 0) return false;
		return 'type' in attachments[0];
	});
	const images = $derived(
		attachments.filter((attachment) => attachment.content_type?.startsWith('image'))
	);
	const videos = $derived(
		attachments.filter((attachment) => attachment.content_type?.startsWith('video'))
	);
	const other = $derived(
		attachments.filter(
			(attachment) =>
				!attachment.content_type?.startsWith('image') &&
				!attachment.content_type?.startsWith('video')
		)
	);
</script>

<div class="attachments">
	{#if images.length > 0}
		<ImageGallery imageAttachments={images} />
	{/if}
	{#if videos.length > 0}
		<video controls>
			<source src={videos[0].url} type={videos[0].content_type} />
			Your browser does not support the video tag.
		</video>
	{/if}
	{#if other.length > 0}
		<div class="other">
			<h4 class="font-semibold">Attachments:</h4>
			<ul class="ms-1">
				{#each other as attachment (attachment.id)}
					<li>
						<a class="text-blue-500" href={attachment.url} target="_blank">{attachment.filename}</a>
					</li>
				{/each}
			</ul>
		</div>
	{/if}
</div>

<style>
</style>
