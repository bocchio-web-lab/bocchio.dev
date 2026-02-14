<script module lang="ts">
    export type AtomicCardData = {
        title: string;
        content: string;
        date?: string;
        image?: string;
    };
</script>

<script lang="ts">
    import {
        Card,
        CardHeader,
        CardTitle,
        CardDescription,
        CardContent,
    } from "$lib/components/ui/card/index";
    import type { HTMLAttributes } from "svelte/elements";
    import { cn } from "$lib/utils";

    interface Props {
        data: AtomicCardData;
        preview?: boolean;
        class?: HTMLAttributes<HTMLDivElement>["class"];
        [key: string]: any;
    }

    let {
        data,
        preview = false,
        class: className = undefined,
        ...rest
    }: Props = $props();
</script>

<Card class={cn("group w-full", className)} {...rest}>
    {#if data.image}
        <img
            src={data.image}
            alt={data.title}
            class="h-44 w-full rounded-t-lg object-cover"
        />
    {/if}

    <CardHeader
        class="flex flex-row flex-wrap items-center justify-between gap-2 pb-2"
    >
        <CardTitle class="leading-tight">{data.title}</CardTitle>
        {#if data.date}
            <CardDescription
                class="text-sm leading-tight text-muted-foreground"
            >
                {data.date}
            </CardDescription>
        {/if}
    </CardHeader>

    <CardContent>
        <div
            class={cn(
                "prose-custom text-sm [&>p:first-child]:mt-0",
                preview ? "line-clamp-1" : "",
            )}
        >
            {@html data.content}
        </div>
    </CardContent>
</Card>
