<script lang="ts">
	import Markdown from '$lib/components/markdown/markdown.svelte';
	import { object } from 'zod';
	import type { PageData } from './$types';
	import { type TokensList } from 'marked';
	import { Inspect } from 'svelte-inspect-value';

	let { data }: { data: PageData } = $props();

	let ast = $state<TokensList>();

	let content = $state<string>(`
# Header
## header 2
### header 3
(Header should only go to 3 levels deep)
#### header 4
##### Header 5
Italics *italics* or _italics_

Underline italics __*underline italics*__

Bold **bold**

Underline bold __**underline bold**__

Bold Italics ***bold italics***

underline bold italics __***underline bold italics***__

Underline __underline__

Strikethrough ~~Strikethrough~~

-# subtext stuff here **subtext**

\`inline code block\`

\`\`\`JSON
{
    "key": "value"
}
\`\`\`

😬

inline custom emoji <:java:1041989576920678460> test

some default emojis 😬 and the illegal microsoft emojis 🇺🇸 🇪🇺 |

and heres a ||spoiler test ***with embold***|| !!!

text with a [link](https://example.com) which you shoud click with no reservations

## Time
short time
<t:1743571320:t>
long time
<t:1743571320:T>
short date
<t:1743571320:d>
long date
<t:1743571320:D>
long date short time
<t:1743571320:f>
long date with day of week and short time
<t:1743571320:F>

> single block quote

### List

- list item 1
- list item 2
- list item 3
	- list item 4

<a href="/potato">tag test</a>

>>> final block quote
 askj
 kdfjhglkdfh
`);
</script>

<div class="grid h-full w-full grid-flow-col grid-cols-2 grow-0 max-h-[calc(100vh-5rem)] overflow-hidden">
	<div class="grid h-full grid-flow-row grid-rows-2 max-h-[inherit]">
		<textarea class="h-full w-full rounded-xl border px-2" bind:value={content}> </textarea>
        <div class="overflow-auto">
		<Markdown
			{content}
			onAst={(tokens) => {
				ast = tokens;
			}}
		/>
        </div>
	</div>
	<div class="h-full px-2 max-h-[inherit] overflow-auto">
		<Inspect value={ast} expandLevel={2} expandPaths={['*.tokens']} />
		<!-- <pre><code>{JSON.stringify(ast, null, 4)}</code></pre> -->
	</div>
</div>
