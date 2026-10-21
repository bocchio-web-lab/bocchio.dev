<script lang="ts">
    import { Button } from "$components/ui/button/index.js";
    import { ArrowLeft } from "@lucide/svelte";

    interface Props {
        title: string;
        description: string;
    }

    let { title, description }: Props = $props();
</script>

<header class="mb-8">
    <Button href="/apps" variant="ghost" size="sm" class="-ml-3 text-muted-foreground">
        <ArrowLeft />
        All apps
    </Button>

    <div class="mt-2 space-y-2 text-center">
        <h1 class="text-3xl font-bold tracking-tight sm:text-4xl">{title}</h1>
        <p class="mx-auto max-w-2xl text-muted-foreground">{description}</p>
    </div>
</header>
