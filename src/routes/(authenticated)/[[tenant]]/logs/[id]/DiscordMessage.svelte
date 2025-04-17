<script lang="ts">
	import * as Avatar from '$lib/components/ui/avatar';
	import { Badge } from '$lib/components/ui/badge';
	import type { Message } from '$lib/modmail';
	import { intlFormat, isToday } from 'date-fns';
	import EyeOff from '@lucide/svelte/icons/eye-off';
	import BotMessageSquare from '@lucide/svelte/icons/bot-message-square';
	import VenetianMask from '@lucide/svelte/icons/venetian-mask';
	import { m } from '$lib/paraglide/messages';
	import { getLocale } from '$lib/paraglide/runtime';
	import Markdown from '$lib/components/markdown/markdown.svelte';
	import MessageAttachments from './MessageAttachments.svelte';
	import { ShieldUser } from '@lucide/svelte';

	const {
		message,
		showUserProfile
	}: { message: Omit<Message, 'timestamp'> & { timestamp: Date }; showUserProfile: boolean } =
		$props();

	const messageDateFormatterLong = $derived(
		new Intl.DateTimeFormat(getLocale(), {
			dateStyle: isToday(message.timestamp) ? undefined : 'short',
			timeStyle: 'short'
		})
	);

	const messageTimeFormatter = $derived(
		new Intl.DateTimeFormat(getLocale(), {
			timeStyle: 'short'
		})
	);
</script>

<div class="group/message flex flex-col items-start ps-16 pt-1 text-sm hover:bg-accent">
	<!-- Show if the previous message was sent more than 5 minutes ago -->
	<!-- current message minus 5 minutes is after the previous message -->
	<!-- User profile  -->
	{#if showUserProfile}
		<div class="flex items-baseline gap-2">
			<div class="absolute left-8">
				<Avatar.Root>
					<Avatar.Image src={message.author.avatar_url} alt={message.author.name[0]} />
					<Avatar.Fallback>{message.author.name[0]}</Avatar.Fallback>
				</Avatar.Root>
			</div>
			<span class="text-xl font-semibold">{message.author.name}</span>
			<time datetime={message.timestamp.toISOString()}
				>{messageDateFormatterLong.format(message.timestamp)}</time
			>
			<!-- message type badges -->
			<div class="flex flex-row gap-x-1 align-baseline">
				{#if message.author.mod}
					<Badge variant="destructive">
						<ShieldUser class="me-2 h-4 w-4" />{m.salty_game_jaguar_slurp()}
					</Badge>
				{/if}
				{#if message.type === 'system'}
					<Badge variant="secondary">
						<BotMessageSquare class="me-2 h-4 w-4" />{m.basic_calm_tuna_flip()}
					</Badge>
				{:else if message.type === 'internal'}
					<Badge variant="secondary"><EyeOff class="me-2 h-4 w-4" />{m.tidy_such_mole_dance()}</Badge>
				{:else if message.type === 'anonymous'}
					<Badge variant="secondary">
						<VenetianMask class="me-2 h-4 w-4" />{m.broad_active_pony_savor()}
					</Badge>
				{/if}
			</div>
		</div>
	{:else}
		<div class="invisible absolute left-5 group-hover/message:visible">
			<time datetime={message.timestamp.toISOString()} class="text-xs">
				{messageTimeFormatter.format(message.timestamp)}
			</time>
		</div>
	{/if}
	<div class="">
		<div class="text-base">
			<Markdown content={message.content} type="extended" />
		</div>
	</div>
	<div class="max-w-[600px]">
		<MessageAttachments attachments={message.attachments} />
	</div>
</div>
