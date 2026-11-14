<script lang="ts">
    import AppPage from "$components/apps/app-page.svelte";
    import ConnectX from "$components/apps/connectx/connectx.svelte";
    import type { PageData } from "./$types";

    let { data }: { data: PageData } = $props();
</script>

<AppPage app={data.app}>
    <ConnectX />
</AppPage>
