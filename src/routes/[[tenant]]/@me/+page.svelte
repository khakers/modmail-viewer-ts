<script lang="ts">
    import type { PageData } from './$types';

    let { data }: { data: PageData } = $props();
    $inspect(data);
</script>
<pre class="mx-auto px-10">
{JSON.stringify(data, null, 2)}
</pre> 