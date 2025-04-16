<script lang="ts">
    	import { Avatar as AvatarPrimitive } from "bits-ui";
	import type { User } from '$lib/modmail';
	import { cn } from '$lib/utils';
	import * as Avatar from './ui/avatar';
	import { clearSearchParams } from "$lib/searchParamUtils";

	let { user, class: className, ...restProps }: { user: User } & AvatarPrimitive.RootProps = $props();
	// The avatar URLs often have size params after them which are unnecesary
	let avatarUrl = $derived(clearSearchParams(user.avatar_url))
</script>

<Avatar.Root class={cn("size-8 border", className)} {...restProps}>
	<Avatar.Image src={avatarUrl} alt={user.name[0]} />
	<Avatar.Fallback>{user.name[0]}</Avatar.Fallback>
</Avatar.Root>

<style>
</style>
