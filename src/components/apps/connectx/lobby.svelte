<script lang="ts">
    import { Button } from "$components/ui/button/index.js";
    import { LogOut } from "@lucide/svelte";
    import type { ConnectXSession } from "$lib/apps/connectx/session.svelte";
    import ComputerCard from "./computer-card.svelte";
    import NewRoomCard from "./new-room-card.svelte";
    import QuickMatchCard from "./quick-match-card.svelte";
    import RoomsCard from "./rooms-card.svelte";

    interface Props {
        session: ConnectXSession;
    }

    let { session }: Props = $props();
</script>

<div class="space-y-4">
    <div class="flex items-center justify-between gap-3">
        <p class="min-w-0 truncate text-sm text-muted-foreground">
            Playing as <strong class="text-foreground">{session.name}</strong>
        </p>
        <Button variant="ghost" size="sm" onclick={() => session.disconnect()}>
            <LogOut />
            Disconnect
        </Button>
    </div>

    <div class="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <!-- The ways to start come first on a small screen, the list of rooms after them -->
        <div class="order-2 min-w-0 lg:order-1">
            <RoomsCard {session} />
        </div>

        <div class="order-1 flex flex-col gap-4 lg:order-2">
            <ComputerCard {session} />
            <QuickMatchCard {session} />
            <NewRoomCard {session} />
        </div>
    </div>
</div>
