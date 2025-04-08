<script lang="ts">
	import type { Attachment, OpenModmailAttachment } from '$lib/modmail';
	import PhotoSwipe from 'photoswipe';
	import PhotoSwipeLightbox from 'photoswipe/lightbox';
	import 'photoswipe/style.css';
	import { onMount } from 'svelte';

	let { imageAttachments }: { imageAttachments: Attachment[] | OpenModmailAttachment[] } = $props();

	const galleryId = $props.id();

	$inspect(imageAttachments);

	// Slice images into groups of two
	const imageGroups = $derived.by(() => {
		const groups: Attachment[][] = [];
		const images = imageAttachments.slice(imageAttachments.length % 2 !== 0 ? 1 : 0);
		for (let i = 0; i < images.length; i += 2) {
			groups.push(images.slice(i, i + 2));
		}
		return groups;
	});
	$inspect(imageGroups);

	// columns is 1 for 1 image, 2 for 2 images, and 2 for 3-4 images
	// a column holds two images, except for the first one which holds one image if the count is odd
	// There cannot be more than 5 columns / 10 images
	const columns = $derived.by(() => {
		if (imageAttachments.length === 0) return 1;
		if (imageAttachments.length === 1) return 1;
		if (imageAttachments.length === 2) return 2;
		if (imageAttachments.length === 3) return 2;
		if (imageAttachments.length === 4) return 2;
		if (imageAttachments.length > 4) return imageAttachments.length / 2;
		return 1;
	});

	$inspect(columns);
	onMount(() => {
		const lightbox = new PhotoSwipeLightbox({
			gallery: `#${galleryId}`,
			children: 'a',
			pswpModule: PhotoSwipe,
			padding: { top: 20, bottom: 20, left: 40, right: 40 },
			showHideAnimationType: 'fade'
		});
		lightbox.init();
	});
</script>

{#snippet image(attachment: Attachment | OpenModmailAttachment)}
	<a
		href={attachment.url}
		data-pswp-width={attachment.width}
		data-pswp-height={attachment.height}
		data-
		target="_blank"
		rel="noopener noreferrer"
		class="flex h-full overflow-hidden"
	>
		<img
			class="max-w-[cal(100% + 1px)] block min-h-full min-w-full overflow-clip object-cover"
			src={attachment.url}
			alt={attachment.description ?? ''}
		/>
	</a>
{/snippet}

<div
	data-cols={columns}
	class="pswp-gallery grid h-80 gap-1 rounded-2xl data-[cols=1]:grid-cols-1 data-[cols=2]:grid-cols-2 data-[cols=3]:grid-cols-3 data-[cols=4]:grid-cols-4 data-[cols=5]:grid-cols-5"
	id={galleryId}
>
	<!-- If there is an odd count of images render one big one -->
	{#if imageAttachments.length % 2 !== 0 || imageAttachments.length === 1}
		{@render image(imageAttachments[0])}
	{/if}
	<!-- slice images into groups of two -->
	{#if imageGroups.length > 0}
		{#each imageGroups as group, i (i)}
			<div class="grid h-full max-h-80 grid-rows-2 gap-2 overflow-hidden">
				{#each group as attachment, j (attachment.id)}
					{@render image(attachment)}
				{/each}
			</div>
		{/each}
	{/if}
</div>

<style>
</style>
