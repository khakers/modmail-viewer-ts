<script lang="ts">
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import * as Table from '$lib/components/ui/table';
	import { m } from '$lib/paraglide/messages';
	import { CheckIcon, ShieldCheckIcon } from '@lucide/svelte';
	import { buttonVariants } from '$lib/components/ui/button';
	import { encodeBase64UUID } from '$lib/uuid-utils';
	import { Checkbox } from '$lib/components/ui/checkbox';
	import { disableThreadShare, getThreadShares } from './sharing.remote';
	import { isBefore } from 'date-fns';

	let { threadId, currentUserId }: { threadId: string; currentUserId: string } = $props();

	const canDisableShares = $derived.by(async () => {
		const shares = await getThreadShares(threadId);
		return shares.some((share) => share.creatorDiscordUserId === currentUserId);
	});
</script>

<svelte:boundary>
	<Dialog.Root>
		<Dialog.Trigger class={buttonVariants({ variant: 'outline' })}>
			{m.soft_sharp_quail_achieve()}
		</Dialog.Trigger>
		<Dialog.Content class="h-[70dvh] content-start md:max-w-4xl">
			<Dialog.Header>
				<Dialog.Title>{m.equal_any_clownfish_clap()}</Dialog.Title>
				<Dialog.Description>{m.spare_crisp_yak_pick()}</Dialog.Description>
			</Dialog.Header>

			<Table.Root>
				<Table.Caption>{m.gross_muddy_peacock_attend()}</Table.Caption>
				<Table.Header>
					<Table.Row>
						<Table.Head class="w-25">{m.fun_clear_gibbon_bake()}</Table.Head>
						<Table.Head>{m.many_smart_jackal_twist()}</Table.Head>
						<Table.Head>{m.low_helpful_barbel_sprout()}</Table.Head>
						<Table.Head>{m.direct_yummy_ox_quell()}</Table.Head>
						<Table.Head>{m.warm_mushy_piranha_burn()}</Table.Head>
						<Table.Head>{m.stout_white_trout_dine()}</Table.Head>
						<Table.Head>{m.calm_salty_piranha_link()}</Table.Head>
						<Table.Head>{m.tame_empty_tiger_type()}</Table.Head>
					</Table.Row>
				</Table.Header>
				<Table.Body class="overflow-y-auto">
					<svelte:boundary>
						{#each await getThreadShares(threadId) as share (share.id)}
							<Table.Row>
								<Table.Cell class="font-mono select-all">
									{encodeBase64UUID(share.id)}
								</Table.Cell>
								<Table.Cell>
									<Checkbox
										checked={share.enabled &&
											(!share.expiresAt ||
												isBefore(new Date(), share.expiresAt))}
										disabled={share.creatorDiscordUserId !== currentUserId}
										onclick={async (event) => {
											try {
												event.preventDefault();
												disableThreadShare({id: share.id, enabled: !share.enabled});
											} catch (error) {
												console.error('Error toggling share', error);
											}
										}}
									/>
								</Table.Cell>
								<Table.Cell>
									{#if share.creatorDiscordUserId === currentUserId}
										{m.fancy_acidic_shrimp_skip()}
									{:else}
										{share.creatorDiscordUserId}
									{/if}
								</Table.Cell>
								<Table.Cell>
									{#if share.requireAuthentication}
										<ShieldCheckIcon class="size-4.5" />
									{/if}
								</Table.Cell>
								<Table.Cell>
									{#if share.showAnonymousSenderName}
										<CheckIcon class="size-4.5" />
									{/if}
								</Table.Cell>
								<Table.Cell>
									{#if share.showInternalMessages}
										<CheckIcon class="size-4.5" />
									{/if}
								</Table.Cell>
								<Table.Cell>
									{#if share.showSystemMessages}
										<CheckIcon class="size-4.5" />
									{/if}
								</Table.Cell>
								<Table.Cell>
									{share.expiresAt?.toLocaleString()}
								</Table.Cell>
							</Table.Row>
						{/each}
					</svelte:boundary>
				</Table.Body>
			</Table.Root>
		</Dialog.Content>
	</Dialog.Root>
</svelte:boundary>

<style>
</style>
