<script lang="ts">
    import { Button } from "$components/ui/button/index.js";
    import * as Card from "$components/ui/card/index.js";
    import { Swords } from "@lucide/svelte";
    import type { ConnectXSession } from "$lib/apps/connectx/session.svelte";

    interface Props {
        session: ConnectXSession;
    }

    let { session }: Props = $props();
</script>

<Card.Root>
    <Card.Header class="px-5 py-4">
        <Card.Title class="text-base">Quick match</Card.Title>
        <Card.Description>
            Join the first game that is waiting for a player, or start one and wait for somebody to
            come.
        </Card.Description>
    </Card.Header>
    <Card.Content class="px-5 pb-5">
        <Button variant="outline" class="w-full" disabled={session.busy} onclick={() => session.quickMatch()}>
            <Swords />
            Find an opponent
        </Button>
    </Card.Content>
</Card.Root>
