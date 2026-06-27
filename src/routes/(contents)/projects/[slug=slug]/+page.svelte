<script lang="ts">
    import Media from "$components/media/media.svelte";
    import { Button } from "$components/ui/button";
    import * as Carousel from "$components/ui/carousel/index.js";
    import type { PageData } from "./$types";
    import { ExternalLink } from "@lucide/svelte";

    let { data }: { data: PageData } = $props();

    const project = $derived(data.project);

    // Formatter for cleaner template code
    const formattedDate = $derived(
        project.published_at
            ? new Date(project.published_at).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
              })
            : null,
    );
</script>

<article class="mx-auto max-w-4xl px-4 py-8">
    <div class="mb-10 text-center">
        <h1
            class="mb-6 text-4xl font-bold tracking-tight text-foreground md:text-5xl"
        >
            {project.title}
        </h1>

        {#if project.excerpt}
            <p class="mx-auto mb-6 max-w-2xl text-xl text-muted-foreground">
                {project.excerpt}
            </p>
        {/if}

        <div
            class="flex flex-wrap items-center justify-center gap-4 text-sm text-muted-foreground"
        >
            {#if project.author}
                <div class="flex items-center gap-2">
                    <span class="font-medium text-foreground"
                        >{project.author.name}</span
                    >
                </div>
            {/if}

            {#if formattedDate}
                <time datetime={project.published_at}>
                    {formattedDate}
                </time>
            {/if}
        </div>
    </div>

    {#if project.meta && project.meta.headerImages && project.meta.headerImages.length > 0}
        <header class="mb-10">
            <Carousel.Root class="w-full">
                <Carousel.Content>
                    {#each project.meta.headerImages as image, index}
                        <Carousel.Item>
                            <div
                                class="aspect-video relative flex w-full items-center justify-center overflow-hidden rounded-lg bg-muted"
                            >
                                <Media
                                    src={image}
                                    alt={project.title}
                                    loading={index === 0 ? "eager" : "lazy"}
                                    fetchpriority={index === 0 ? "high" : "low"}
                                    crop="pad"
                                    height={486}
                                    width={864}
                                />
                            </div>
                        </Carousel.Item>
                    {/each}
                </Carousel.Content>
                {#if project.meta.headerImages.length > 1}
                    <Carousel.Previous />
                    <Carousel.Next />
                {/if}
            </Carousel.Root>
        </header>
    {/if}

    {#if (project.tags && project.tags.length > 0) || (project.meta && project.meta.externalLinks && project.meta.externalLinks.length > 0)}
        <div class="mb-12 flex flex-col items-center gap-6 border-b pb-12">
            {#if project.tags && project.tags.length > 0}
                <div class="flex flex-wrap justify-center gap-2">
                    {#each project.tags as tag}
                        <span
                            class="rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary"
                        >
                            {tag.name}
                        </span>
                    {/each}
                </div>
            {/if}

            {#if project.meta && project.meta.externalLinks && project.meta.externalLinks.length > 0}
                <div class="flex flex-wrap justify-center gap-3">
                    {#each project.meta.externalLinks as link}
                        <Button
                            href={link.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            variant="outline"
                        >
                            {link.title}
                            <ExternalLink class="ml-2 size-4 opacity-70" />
                        </Button>
                    {/each}
                </div>
            {/if}
        </div>
    {/if}

    <div class="prose-custom">
        {@html project.body}
    </div>
</article>
