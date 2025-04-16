<script lang="ts">
	import * as Tooltip from '$lib/components/ui/tooltip/index.js';
	import { getLocale } from '$lib/paraglide/runtime';
	import { formatRelative } from 'date-fns/formatRelative';

	let { date }: { date: Date } = $props();

	const formatter = new Intl.DateTimeFormat(getLocale(), {
					dateStyle: 'full',
					timeStyle: 'short'
				})
</script>

<span>
	<Tooltip.Provider>
		<Tooltip.Root>
			<Tooltip.Trigger>
				<time datetime={new Date(date).toISOString()}>
					{formatRelative(new Date(date), new Date())}
				</time>
			</Tooltip.Trigger>
			<Tooltip.Content>
				<time datetime={new Date(date).toISOString()}>
					{formatter.format(new Date(date))}
				</time>
			</Tooltip.Content>
		</Tooltip.Root>
	</Tooltip.Provider>
</span>

<style>
</style>
