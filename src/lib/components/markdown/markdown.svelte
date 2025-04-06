<script lang="ts">
	import Emoji from '$lib/components/markdown/components/discord/emoji.svelte';
	import Codespan from './components/Codespan.svelte';
	import Heading from './components/Heading.svelte';
	import Code from './components/Code.svelte';
	import Em from './components/em.svelte';
	import Strong from './components/strong.svelte';
	import Text from './components/Text.svelte';
	import Timestamp from './components/discord/timestamp.svelte';
	import Paragraph from './components/Paragraph.svelte';
	import type { Tokens, TokensList } from 'marked';
	import { getMarked } from './marked';
	import { type Component } from 'svelte';
	import Underline from '$lib/components/markdown/components/discord/Underline.svelte';
	import Strikethrough from '$lib/components/markdown/components/discord/Strikethrough.svelte';
	import Subtext from './components/discord/subtext.svelte';
	import Space from '$lib/components/markdown/components/Space.svelte';
	import Twemoji from './components/discord/Twemoji.svelte';
	import Spoiler from './components/discord/Spoiler.svelte';
	import Link from './components/Link.svelte';
	import List from './components/List.svelte';
	import ListItem from './components/ListItem.svelte';

	let {
		content,
		type,
		onAst
	}: { content: string; type?: 'normal' | 'extended'; onAst?: (arg0: TokensList) => void } =
		$props();

	const components: Record<string, Component<any>> = {
		heading: Heading,
		paragraph: Paragraph,
		text: Text,
		// image: null,
		link: Link,
		em: Em,
		strong: Strong,
		codespan: Codespan,
		del: Strikethrough,
		// table: Table,
		// tablehead: TableHead,
		// tablebody: TableBody,
		// tablerow: TableRow,
		// tablecell: TableCell,
		list: List,
		// orderedlistitem: null,
		// unorderedlistitem: null,
		list_item: ListItem,
		// hr: Hr,
		html: Text,
		blockquote: Paragraph,
		code: Code,
		space: Space,
		// br: Br,
		// BEGIN DISCORD RENDERERS
		emoji: Emoji,
		roleMention: Text,
		userMention: Text,
		channelMention: Text,
		everyone: Text,
		here: Text,
		spoiler: Spoiler,
		strikethrough: Strikethrough,
		timestamp: Timestamp,
		twemoji: Twemoji,
		underline: Underline,
		subtext: Subtext
	};

	// the lexer stores state so must be crecreated every time we reparse the content
	const ast = $derived.by(() => {
		console.log(content);
		return getMarked().lexer(content);

		// return new Lexer({
		// 	gfm: false,
		// 	pedantic: false,
		// 	extensions: {
		// 		inline: [EmojiExtension.tokenizer, TwemojiExtension.tokenizer, TimestampExtension.tokenizer]
		// 	}
		// }).lex(content);
	});

	$effect(() => {
		if (onAst) {
			onAst(ast);
		}
	});

	$inspect(ast);

	function getElement(type: string) {
		const el = components[type] || Text;
		// logger.trace({ type, el }, 'getElement');
		return el;
	}

	// const parsed = $derived(parse(content, type));
</script>

{#snippet markdownNode(tokens: Tokens.Generic, Component: Component)}
	<Component node={tokens}>
		{#if tokens.tokens !== undefined}
			{#each tokens.tokens as token}
				{@render markdownNode(token, getElement(token.type))}
			{/each}
		{/if}
	</Component>
	<!-- <svelte:component this={renderers[tokens.type]} node={tokens}>
		{#if tokens.tokens !== undefined}
			{#each tokens.tokens as token}
				{@render markdownNode(token)}
			{/each}
		{/if}
	</svelte:component> -->
{/snippet}

<svelte:boundary>
	<div class="whitespace-break-spaces text-pretty ">
		{#each ast as e}
			{@const Element = getElement(e.type)}
			{@render markdownNode(e, Element)}
		{/each}
	</div>
</svelte:boundary>

<!-- <pre><code>{JSON.stringify(ast, null, 4)}</code></pre> -->

<style>
</style>
