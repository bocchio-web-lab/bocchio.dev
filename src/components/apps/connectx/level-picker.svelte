<script lang="ts">
    import { Label } from "$components/ui/label/index.js";
    import * as Select from "$components/ui/select/index.js";
    import type { ConnectXSession } from "$lib/apps/connectx/session.svelte";

    interface Props {
        session: ConnectXSession;
        id: string;
    }

    let { session, id }: Props = $props();

    const levels = $derived(session.levels?.levels ?? []);
    const chosen = $derived(levels.find((level) => level.level === session.level));
</script>

<div class="space-y-2">
    <Label for={id}>How strong should it be?</Label>
    <Select.Root
        type="single"
        value={String(session.level)}
        onValueChange={(value) => (session.level = Number(value))}
    >
        <Select.Trigger {id} class="w-full">
            {chosen?.name}
        </Select.Trigger>
        <Select.Content>
            {#each levels as level (level.level)}
                <Select.Item value={String(level.level)} label={level.name}>
                    {level.name}
                </Select.Item>
            {/each}
        </Select.Content>
    </Select.Root>
    <p class="text-xs text-muted-foreground">{chosen?.summary}</p>
</div>
