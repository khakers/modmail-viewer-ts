<script lang="ts">
	import { buttonVariants } from '$lib/components/ui/button/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Checkbox } from '$lib/components/ui/checkbox/index.js';
	import * as Field from '$lib/components/ui/field/index.js';
	import * as Popover from '$lib/components/ui/popover/index.js';
	import { ShareIcon } from '@lucide/svelte';

	import { shareThread } from './sharing.remote';

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
					console.log('WTKLSD:AJGKLSD');
					try {
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
									class="appearance-none  border-input dark:bg-input/30 checked:bg-primary checked:text-primary-foreground dark:checked:bg-primary checked:border-primary focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive peer flex size-4 shrink-0 items-center justify-center rounded-[4px] border shadow-xs transition-shadow outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 checked:before:"
								/>
								<Checkbox {...requireAuthentication.as('checkbox')} />
								<Field.Content>
									<Field.Label>Require Authentication</Field.Label>
									<Field.Description>
										Require a user to be logged in via Discord before they can
										view the shared thread.
									</Field.Description>
								</Field.Content>
								{#each shareThread.fields.requireAuthentication.issues() as item}
									<Field.Error>{item.message}</Field.Error>
								{/each}
							</Field.Field>
							<Field.Field orientation="horizontal">
								<input
									{...shareThread.fields.showInternalMessages.as('checkbox')}
									class="border-input dark:bg-input/30 accent-accent-foreground dark:checked:bg-primary checked:border-primary focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive peer flex size-4 shrink-0 items-center justify-center rounded-[4px] border shadow-xs transition-shadow outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50"
								/>
								<Checkbox
									{...shareThread.fields.showInternalMessages.as('checkbox')}
								/>
								<Field.Content>
									<Field.Label>Show Internal Messages</Field.Label>
									<Field.Description>
										Show internal staff messages. e.g messages sent by staff in
										the channel that are not replies.
									</Field.Description>
								</Field.Content>
								{#each shareThread.fields.showInternalMessages.issues() as item}
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
								{#each shareThread.fields.showAnonymousSenderName.issues() as item}
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
								{#each shareThread.fields.showSystemMessages.issues() as item}
									<Field.Error>{item.message}</Field.Error>
								{/each}
							</Field.Field>
						</Field.Group>
					</Field.Set>
					<Field.Set>
						<!-- TODO expiration not being set -->
						<Field.Legend>Expiration</Field.Legend>
						<!-- For reasons unknown, the expiresAt is not actually being sent in the form -->
						<!-- {@const supplier = shareThread.fields.expiresAt.as('date')} -->
						<input
							{...shareThread.fields.expiresAt.as('date')}
							min={new Date().toISOString().split('T')[0]}
							class="bg-background hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50 border shadow-xs"
						/>
						<!-- <DateSelector
							bind:expiresAt={
								() =>
									supplier.value
                                        ? new Date(supplier.value)
                                        : null,
								(value) =>
									supplier.value =
                                        value instanceof Date ? value.toISOString() : ''
							}
						/> -->
						<!-- <div>{supplier.value}</div> -->
						{#each shareThread.fields.expiresAt.issues() as item}
							<Field.Error>{item.message}</Field.Error>
						{/each}
					</Field.Set>
					<Field.Field orientation="horizontal">
						<Button type="submit">Submit</Button>
						<Button variant="outline" type="button" onclick={() => (open = false)}
							>Cancel</Button
						>
					</Field.Field>
				</Field.Group>
			</form>
		</div>
	</Popover.Content>
</Popover.Root>

<style>
    /* input[type="checkbox"]::before {
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-check-icon lucide-check"><path d="M20 6 9 17l-5-5"/></svg>
        content: url("data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiIGNsYXNzPSJsdWNpZGUgbHVjaWRlLWNoZWNrLWljb24gbHVjaWRlLWNoZWNrIj48cGF0aCBkPSJNMjAgNiA5IDE3bC01LTUiLz48L3N2Zz4=");
        position: absolute;
        display: block;
    } */
</style>
