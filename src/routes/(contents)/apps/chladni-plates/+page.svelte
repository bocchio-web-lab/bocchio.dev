<script lang="ts">
    import AppPage from "$components/apps/app-page.svelte";
    import ChladniPlates from "$components/apps/chladni-plates/chladni-plates.svelte";
    import type { PageData } from "./$types";

    let { data }: { data: PageData } = $props();
</script>

<AppPage app={data.app}>
    <ChladniPlates />
</AppPage>
