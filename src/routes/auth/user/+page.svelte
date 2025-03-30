<script lang="ts">
    import type { PageData } from './$types';

    let { data }: { data: PageData } = $props();
</script>
<h1>User Info</h1>
<table>
    <tbody>
        <tr>
            <th>Discord User ID</th>
            <td>{data.discordUserId}</td>
        </tr>
        <tr>
            <th>Expires At</th>
            <td>{data.expiresAt}</td>
        </tr>
    </tbody>
</table>
