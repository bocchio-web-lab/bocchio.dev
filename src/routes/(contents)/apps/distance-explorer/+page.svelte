<script lang="ts">
    import AppPage from "$components/apps/app-page.svelte";
    import DistanceExplorer from "$components/apps/distance-explorer/distance-explorer.svelte";
    import type { PageData } from "./$types";

    let { data }: { data: PageData } = $props();
</script>

<AppPage app={data.app}>
    <DistanceExplorer />
</AppPage>
