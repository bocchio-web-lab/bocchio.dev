<script lang="ts">
    import { cn } from "$lib/utils";
    import { CldImage } from "svelte-cloudinary";

    type Props = {
        src: string;
        alt?: string;
        width?: number;
        height?: number;
        class?: string;
        [key: string]: any;
    };

    let {
        src,
        alt = "",
        width = 840,
        height = 840,
        class: className = "",
        ...rest
    }: Props = $props();

    const baseClasses =
        "!w-full !h-full !max-w-full !max-h-full !object-contain rounded-lg";
</script>

{#if src.includes("res.cloudinary.com")}
    {#if src.includes("/video/upload/")}
        <video
            {src}
            {width}
            {height}
            muted={true}
            autoplay={true}
            loop={true}
            playsinline
            webkit-playsinline={true}
            preload="metadata"
            class={cn(baseClasses, className)}
            {...rest}
        ></video>
    {:else}
        <CldImage
            {src}
            {alt}
            {width}
            {height}
            class={cn(baseClasses, className)}
            {...rest}
        />
    {/if}
{:else}
    <img
        {src}
        {alt}
        {width}
        {height}
        class={cn(baseClasses, className)}
        {...rest}
    />
{/if}
