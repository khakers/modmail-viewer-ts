<script lang="ts">
	import type { PartialGuild } from '$lib/server/discord';
	import * as Avatar from './ui/avatar';
	import { Avatar as AvatarPrimitive } from 'bits-ui';

	let {
		guild,
		ref = $bindable(null),
		class: className,
		...restProps
	}: AvatarPrimitive.RootProps & { guild: PartialGuild | undefined } = $props();

	function generateFallback(text: string): string {
		if (!text) return '?';
		if (!text.trim()) return '';

		// text splitting delimters
		const segments = text.split(/[\s\.\-_]+/);

		// Extract initials from each segment
		const initials = segments
			.filter((segment) => segment.length > 0) // Ignore empty segments
			.map((segment) => segment[0]);

		return initials.join('');
	}

	const fallback = $derived(generateFallback(guild?.name ?? ''));
	// if the icon starts with 'a_' it means it's an animated icon.
	let url = $derived(
		guild && guild.id && guild.icon
			? `https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.${guild.icon.startsWith('a_') ? 'gif' : 'png'}`
			: null
	);
</script>

<Avatar.Root bind:ref class={className} {...restProps}>
	<Avatar.Image src={url} alt="discord guild icon" class="bg-background" />
	<Avatar.Fallback class="text-primary">{fallback}</Avatar.Fallback>
</Avatar.Root>
