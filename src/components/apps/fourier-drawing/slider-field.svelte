<script lang="ts">
    import { Label } from "$components/ui/label/index.js";
    import { Slider } from "$components/ui/slider/index.js";

    interface Props {
        label: string;
        /** What the current value means, as text: "1.5×", "30%"... */
        display: string;
        value: number;
        min: number;
        max: number;
        step: number;
        disabled?: boolean;
        /** A line of explanation under the slider. */
        hint?: string;
        onchange: (value: number) => void;
    }

    let {
        label,
        display,
        value,
        min,
        max,
        step,
        disabled = false,
        hint,
        onchange,
    }: Props = $props();

    const id = $props.id();
</script>

<div class="space-y-2.5">
    <div class="flex items-baseline justify-between gap-2">
        <Label id="{id}-label">{label}</Label>
        <span class="text-sm text-muted-foreground tabular-nums">{display}</span>
    </div>
    <Slider
        type="single"
        aria-labelledby="{id}-label"
        {value}
        {min}
        {max}
        {step}
        {disabled}
        onValueChange={onchange}
    />
    {#if hint}
        <p class="text-xs text-muted-foreground">{hint}</p>
    {/if}
</div>
