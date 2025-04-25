<script lang="ts">
	import { getLocale } from '$lib/paraglide/runtime';
	import { fromUnixTime } from 'date-fns';
	import type { Tokens } from 'marked';

	type TimestampToken = Tokens.Generic & {
		type: 'timestamp';
		timestamp: string;
		format: 'R' | 't' | 'T' | 'd' | 'D' | 'f' | 'F' | undefined;
	};

	let { node }: { node: TimestampToken } = $props();

	const date = $derived(fromUnixTime(parseInt(node.timestamp)));

	const locale = getLocale();


	const formatter = $derived.by(() => {
		switch (node.format) {
			// short time
			case 't':
				return new Intl.DateTimeFormat(locale, {
					dateStyle: undefined,
					timeStyle: 'short'
				});
			// 	long time
			case 'T':
				return new Intl.DateTimeFormat(locale, {
					dateStyle: undefined,
					timeStyle: 'medium'
				});
			// 	short date
			case 'd':
				return new Intl.DateTimeFormat(locale, {
					dateStyle: 'short',
					timeStyle: undefined
				});
			// 	long date
			case 'D':
				return new Intl.DateTimeFormat(locale, {
					dateStyle: 'long',
					timeStyle: undefined
				});
			// long date short time
			case 'f':
				return new Intl.DateTimeFormat(locale, {
					dateStyle: 'long',
					timeStyle: 'short'
				});
			// 	long date with day of week and short time
			case 'F':
				return new Intl.DateTimeFormat(locale, {
					dateStyle: 'long',
					timeStyle: 'medium'
				});
			default:
				return new Intl.DateTimeFormat(locale, {
					dateStyle: 'long',
					timeStyle: 'short'
				});
		}
	});
</script>

<time class="rounded-md bg-accent px-1" datetime={date.toISOString()}>
	{formatter.format(date)}
</time>

<style>
</style>
