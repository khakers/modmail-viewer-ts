<script lang="ts">
	import { buttonVariants } from '$lib/components/ui/button/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Field from '$lib/components/ui/field/index.js';
	import * as Popover from '$lib/components/ui/popover/index.js';
	import { ShareIcon } from '@lucide/svelte';

	import { shareThread } from './sharing.remote';
	import { Spinner } from '$lib/components/ui/spinner';
	
	let { threadId }: { threadId: string } = $props();

	let open = $state(false);

	const {
		requireAuthentication,
		showInternalMessages,
		showAnonymousSenderName,
		showSystemMessages,
		expiresAt
	} = shareThread.fields;
</script>

<Popover.Root bind:open>
	<Popover.Trigger class={buttonVariants({ variant: 'secondary', size: 'icon' })}>
		<ShareIcon />
	</Popover.Trigger>
	<Popover.Content class="w-96">
		<div class="max-h-175 overflow-y-auto">
			<form
				{...shareThread.enhance(async ({ form, data, submit }) => {
					try {
						// TODO remove debug
						// surface errors to the user
						console.debug('Submitting share thread form');
						console.debug(data);
						await submit();
						form.reset();
					} catch (error) {
						console.error('Error submitting share thread form', error);
					}
				})}
				class="w-full space-y-5"
			>
				<input {...shareThread.fields.id.as('hidden', threadId)} />
				<Field.Group>
					<Field.Set>
						<Field.Legend>Sharing Options</Field.Legend>
						<Field.Group>
							<Field.Field orientation="horizontal">
								<!-- I'm using inputs instead of the Checkbox component because it causes an issue where there are different or detached form instances or values -->
								<input
									{...requireAuthentication.as('checkbox')}
									class="border-input dark:bg-input/30 accent-accent-foreground dark:data-[state=checked]:bg-primary data-[state=checked]:border-primary focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive peer flex size-4 shrink-0 items-center justify-center rounded-[4px] border shadow-xs transition-shadow outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50"
								/>
								<Field.Content>
									<Field.Label>Require Authentication</Field.Label>
									<Field.Description>
										Require a user to be logged in via Discord before they can
										view the shared thread.
									</Field.Description>
								</Field.Content>
								{#each shareThread.fields.requireAuthentication.issues() as item (item.path)}
									<Field.Error>{item.message}</Field.Error>
								{/each}
							</Field.Field>
							<Field.Field orientation="horizontal">
								<input
									{...shareThread.fields.showInternalMessages.as('checkbox')}
									class="border-input dark:bg-input/30 accent-accent-foreground dark:data-[state=checked]:bg-primary data-[state=checked]:border-primary focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive peer flex size-4 shrink-0 items-center justify-center rounded-[4px] border shadow-xs transition-shadow outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50"
								/>

								<Field.Content>
									<Field.Label>Show Internal Messages</Field.Label>
									<Field.Description>
										Show internal staff messages. e.g messages sent by staff in
										the channel that are not replies.
									</Field.Description>
								</Field.Content>
								{#each shareThread.fields.showInternalMessages.issues() as item (item.path)}
									<Field.Error>{item.message}</Field.Error>
								{/each}
							</Field.Field>
							<Field.Field orientation="horizontal">
								<input
									{...shareThread.fields.showAnonymousSenderName.as('checkbox')}
									class="border-input dark:bg-input/30 accent-accent-foreground dark:data-[state=checked]:bg-primary data-[state=checked]:border-primary focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive peer flex size-4 shrink-0 items-center justify-center rounded-[4px] border shadow-xs transition-shadow outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50"
								/>

								<Field.Content>
									<Field.Label>Show Anonymous Sender Name</Field.Label>
									<Field.Description>
										Show the names of senders who have been anonymized.
									</Field.Description>
								</Field.Content>
								{#each shareThread.fields.showAnonymousSenderName.issues() as item (item.path)}
									<Field.Error>{item.message}</Field.Error>
								{/each}
							</Field.Field>
							<Field.Field orientation="horizontal">
								<input
									{...shareThread.fields.showSystemMessages.as('checkbox')}
									class="border-input dark:bg-input/30 accent-accent-foreground dark:data-[state=checked]:bg-primary data-[state=checked]:border-primary focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive peer flex size-4 shrink-0 items-center justify-center rounded-[4px] border shadow-xs transition-shadow outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50"
								/>

								<Field.Content>
									<Field.Label>Show System Messages</Field.Label>
									<Field.Description>
										Show system messages in the shared thread.
									</Field.Description>
								</Field.Content>
								{#each shareThread.fields.showSystemMessages.issues() as item (item.path)}
									<Field.Error>{item.message}</Field.Error>
								{/each}
							</Field.Field>
						</Field.Group>
					</Field.Set>
					<Field.Set>
						<Field.Legend>Expiration</Field.Legend>
						<input
							{...shareThread.fields.expiresAt.as('date')}
							min={new Date().toISOString().split('T')[0]}
							class="bg-background hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50 border shadow-xs"
						/>
						{#each shareThread.fields.expiresAt.issues() as item (item.path)}
							<Field.Error>{item.message}</Field.Error>
						{/each}
					</Field.Set>
					<Field.Field orientation="horizontal">
						<Button type="submit">Submit</Button>
						<Button variant="outline" type="button" onclick={() => (open = false)}>
							Cancel
						</Button>
						<!-- <Spinner class="ms-auto" /> -->
						{#if shareThread.pending}
							<span class="flex flex-row"><Spinner />Creating share link...</span>
						{/if}
					</Field.Field>
				</Field.Group>
			</form>
		</div>
	</Popover.Content>
</Popover.Root>

<style>
</style>
