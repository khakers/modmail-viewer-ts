<script lang="ts">
	import { buttonVariants } from '$lib/components/ui/button';
	import { Calendar } from '$lib/components/ui/calendar/index.js';
	import * as Popover from '$lib/components/ui/popover/index.js';
	import * as Select from '$lib/components/ui/select/index.js';
	import { getLocale } from '$lib/paraglide/runtime';
	import { cn } from '$lib/utils';
	import {
		DateFormatter,
		fromDate,
		getLocalTimeZone,
		today,
		type DateValue
	} from '@internationalized/date';
	import { CalendarIcon } from '@lucide/svelte';
	import type { ControlAttrs } from 'formsnap';

	let {
		expiresAt = $bindable(),
		props
	}: { expiresAt: Date | null; props: Expand<ControlAttrs> } = $props();

	const df = new DateFormatter(getLocale(), {
		dateStyle: 'long'
	});

	let value = $derived(
		expiresAt ? fromDate(expiresAt, getLocalTimeZone()).subtract({ days: 1 }) : undefined
	);

	const valueString = $derived(value ? df.format(value.toDate()) : '');

	const items = [
		{ value: 0, label: 'Today' },
		{ value: 1, label: 'Tomorrow' },
		{ value: 3, label: 'In 3 days' },
		{ value: 7, label: 'In a week' }
	];

	let placeholder = $state<DateValue>(today(getLocalTimeZone()));
</script>

<Popover.Root>
	<Popover.Trigger
		{...props}
		class={cn(
			buttonVariants({ variant: 'outline' }),
			'w-[280px] justify-start pl-4 text-left font-normal',
			!expiresAt && 'text-muted-foreground'
		)}
	>
		{expiresAt ? valueString : 'Pick a date'}
		<CalendarIcon class="ml-auto size-4 opacity-50" />
	</Popover.Trigger>
	<Popover.Content class="w-auto p-0" side="top">
		<Select.Root
			type="single"
			bind:value={
				() => valueString,
				(v) => {
					if (!v) return;
					expiresAt = today(getLocalTimeZone())
						.add({ days: Number.parseInt(v) })
						.add({ days: 1 })
						.toDate(getLocalTimeZone());
				}
			}
		>
			<Select.Trigger>
				{valueString}
			</Select.Trigger>
			<Select.Content>
				{#each items as item (item.value)}
					<Select.Item value={`${item.value}`}>{item.label}</Select.Item>
				{/each}
			</Select.Content>
		</Select.Root>
		<Calendar
			type="single"
			bind:value
			locale={getLocale()}
			onValueChange={(v) => {
				if (v) {
					expiresAt = v.add({ days: 1 }).toDate(getLocalTimeZone());
				} else {
					expiresAt = null;
				}
			}}
			bind:placeholder
			minValue={today(getLocalTimeZone())}
			calendarLabel="Expiration Time"
		/>
	</Popover.Content>
</Popover.Root>

<style>
</style>
