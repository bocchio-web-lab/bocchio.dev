<script lang="ts">
    import AppPage from "$components/apps/app-page.svelte";
    import FourierDrawing from "$components/apps/fourier-drawing/fourier-drawing.svelte";
    import type { PageData } from "./$types";

    let { data }: { data: PageData } = $props();
</script>

<AppPage app={data.app}>
    <FourierDrawing />
</AppPage>
