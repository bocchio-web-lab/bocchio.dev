<script lang="ts">
    import { Button } from "$components/ui/button/index.js";
    import * as Card from "$components/ui/card/index.js";
    import { Input } from "$components/ui/input/index.js";
    import { ArrowRight, ImageUp } from "@lucide/svelte";
    import { PRESETS, type PresetId } from "$lib/apps/fourier-drawing/presets";
    import type { FourierStudio } from "$lib/apps/fourier-drawing/studio.svelte";

    interface Props {
        studio: FourierStudio;
        onpreset: (id: PresetId) => void;
        onfile: (file: File) => void;
        onurl: (url: string) => void;
    }

    let { studio, onpreset, onfile, onurl }: Props = $props();

    let link = $state("");

    const activePreset = $derived(
        studio.source?.kind === "preset" ? studio.source.id : null,
    );

    // A link that comes from the address (a shared page) shows up in the field too
    $effect(() => {
        if (studio.source?.kind === "url") link = studio.source.url;
    });

    function submit(event: SubmitEvent) {
        event.preventDefault();

        const url = link.trim();
        if (url) onurl(url);
    }
</script>

<Card.Root>
    <Card.Header class="px-5 py-4">
        <Card.Title class="text-base">What to draw</Card.Title>
    </Card.Header>
    <Card.Content class="space-y-4 px-5 pb-5">
        <label
            class="flex cursor-pointer flex-col items-center gap-1 rounded-lg border-2 border-dashed p-4 text-center transition-colors hover:border-primary hover:bg-primary/5 focus-within:border-primary focus-within:ring-[3px] focus-within:ring-ring/50"
        >
            <ImageUp class="size-6 text-primary" />
            <span class="text-sm font-medium">
                Drop a picture here, or click to choose one
            </span>
            <span class="text-xs text-muted-foreground">
                It stays on your computer: nothing is uploaded.
            </span>
            <input
                type="file"
                accept="image/*"
                class="sr-only"
                onchange={(event) => {
                    const input = event.currentTarget;
                    const file = input.files?.[0];

                    if (file) onfile(file);

                    // Lets the same file be picked again
                    input.value = "";
                }}
            />
        </label>

        <form class="space-y-1.5" onsubmit={submit} novalidate>
            <div class="flex gap-2">
                <Input
                    type="url"
                    bind:value={link}
                    placeholder="…or paste a link to a picture"
                    aria-label="Link to a picture"
                    autocomplete="off"
                    spellcheck={false}
                />
                <Button
                    type="submit"
                    variant="outline"
                    size="icon"
                    class="shrink-0"
                    aria-label="Load the picture"
                    title="Load the picture"
                    disabled={studio.busy || link.trim() === ""}
                >
                    <ArrowRight />
                </Button>
            </div>
            <p class="text-xs text-muted-foreground">
                If the website does not allow it, the picture is fetched through
                the free images.weserv.nl proxy.
            </p>
        </form>

        <div class="space-y-2">
            <p class="text-sm font-medium">Or start from a shape</p>
            <div class="flex flex-wrap gap-2">
                {#each PRESETS as preset (preset.id)}
                    <Button
                        size="sm"
                        variant={activePreset === preset.id ? "default" : "outline"}
                        aria-pressed={activePreset === preset.id}
                        onclick={() => onpreset(preset.id)}
                    >
                        {preset.label}
                    </Button>
                {/each}
            </div>
        </div>
    </Card.Content>
</Card.Root>
