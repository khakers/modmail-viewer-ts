<script lang="ts">
	import { buttonVariants } from '$lib/components/ui/button/index.js';
	import * as Form from '$lib/components/ui/form/index';
	import * as Popover from '$lib/components/ui/popover/index.js';
	import { ShareIcon } from '@lucide/svelte';

	import { resolveRoute } from '$app/paths';
	import { page } from '$app/state';
	import { Snippet } from '$lib/components/ui/snippet';
	import { Switch } from '$lib/components/ui/switch';
	import { addToPanel } from 'svelte-inspect-value';
	import { fromStore } from 'svelte/store';
	import { fade } from 'svelte/transition';
	import {
		superForm,
		type FormResult,
		type Infer,
		type SuperValidated
	} from 'sveltekit-superforms';
	import { zod4Client } from 'sveltekit-superforms/adapters';
	import type { ActionData } from './$types';
	import DateSelector from './DateSelector.svelte';
	import { formSchema, type LogSharingFormSchema } from './schema';

	let { shareForm = $bindable() }: { shareForm: SuperValidated<Infer<LogSharingFormSchema>> } =
		$props();

	let shareId: string | undefined = $state(undefined);
	const shareUrl = $derived.by(() => {
        if (shareId === undefined) {
            return undefined;
        }
		const url = new URL(page.url);
		url.pathname = resolveRoute('/share/[id]', {
			id: shareId
		});
        return url;
	});

	const form = superForm(shareForm, {
		validators: zod4Client(formSchema),
		resetForm: false,
		// For some reason, superforms will not send the requireAuthentication field if this is not set to json
		dataType: 'json',
		onUpdate({ form, result }) {
			const action = result.data as FormResult<ActionData>;
			if (form.valid && action.shareId) {
				shareId = action.shareId;
			}
		}
	});

	const tainted = fromStore(form.tainted);


	$effect(() => {
		if (tainted.current) {
			shareId = undefined;
		}
	});

	const { form: formData, enhance } = form;

    // $inspect($formData.expiresAt)

    addToPanel('shareForm',() => form);
</script>

<Popover.Root>
	<Popover.Trigger class={buttonVariants({ variant: 'secondary', size: 'icon' })}>
		<ShareIcon />
	</Popover.Trigger>
	<Popover.Content class="w-96">
		<div class="max-h-[700px] overflow-y-auto">
			<form method="POST" action="?/share" use:enhance class="w-full space-y-5">
				<fieldset>
					<legend class="mb-4 text-lg font-medium"> Sharing Options </legend>
					<div class="space-y-4">
						<Form.Field
							{form}
							name="requireAuthentication"
							class="flex flex-row items-center justify-between rounded-lg border p-4"
						>
							<Form.Control>
								{#snippet children({ props })}
									<div class="space-y-0.5">
										<Form.Label>Require Authentication</Form.Label>
										<Form.Description>
											Require a user to be logged in via Discord before they
											can view the shared thread.
										</Form.Description>
									</div>
									<Switch
										{...props}
										bind:checked={$formData.requireAuthentication}
									/>
								{/snippet}
							</Form.Control>
						</Form.Field>
						<Form.Field
							{form}
							name="showInternalMessages"
							class="flex flex-row items-center justify-between rounded-lg border p-4"
						>
							<Form.Control>
								{#snippet children({ props })}
									<div class="space-y-0.5">
										<Form.Label>Show internal messages</Form.Label>
										<Form.Description>
											Show internal staff messages. e.g messages sent by staff
											in the channel that are not replies.
										</Form.Description>
									</div>
									<Switch
										{...props}
										bind:checked={$formData.showInternalMessages}
									/>
								{/snippet}
							</Form.Control>
						</Form.Field>
						<Form.Field
							{form}
							name="showAnonymousSenderName"
							class="flex flex-row items-center justify-between rounded-lg border p-4"
						>
							<Form.Control>
								{#snippet children({ props })}
									<div class="space-y-0.5">
										<Form.Label>Show anonymous message authors</Form.Label>
										<Form.Description>
											Show the author of anonymous messages.
										</Form.Description>
									</div>
									<Switch
										{...props}
										bind:checked={$formData.showAnonymousSenderName}
									/>
								{/snippet}
							</Form.Control>
						</Form.Field>
						<Form.Field
							{form}
							name="showSystemMessages"
							class="flex flex-row items-center justify-between rounded-lg border p-4"
						>
							<Form.Control>
								{#snippet children({ props })}
									<div class="space-y-0.5">
										<Form.Label>Show System Messages</Form.Label>
										<Form.Description>
											Show system type messages. e.g notes
										</Form.Description>
									</div>
									<Switch
										{...props}
										bind:checked={$formData.showSystemMessages}
									/>
								{/snippet}
							</Form.Control>
						</Form.Field>
						<Form.Field {form} name="expiresAt" class="flex flex-col">
							<Form.Control>
								{#snippet children({ props })}
									<Form.Label>Expiration Time</Form.Label>
                                    <!-- This doesn't seem to be updating the form value from expiresAt -->
                                    <DateSelector bind:expiresAt={$formData.expiresAt} props={props} />
									<Form.Description>
                                        The sharing link will stop functioning after this date.
                                        </Form.Description>
									<Form.FieldErrors />
									<input
										hidden
										value={$formData.expiresAt}
										name={props.name}
									/>
								{/snippet}
							</Form.Control>
						</Form.Field>
					</div>
				</fieldset>
				<Form.Button>Share</Form.Button>

				{#if shareUrl}
				<div transition:fade="{{delay: 250, duration: 300}}">
					<!-- <h3>Sharing link</h3> -->
					<!-- TODO this doesn't update when form becomes tainted -->
					<Snippet text={shareId ? shareUrl.toString() : ''} class="" />
				</div>
				{/if}
				<!-- <Inspect value={form} /> -->
			</form>
			<!-- <SuperDebug data={form} /> -->
		</div>
	</Popover.Content>
</Popover.Root>

<div></div>

<style>
</style>
