<script lang="ts">
    import { onDestroy, onMount } from "svelte";
    import * as publicEnv from "$env/static/public";
    import { X } from "@lucide/svelte";
    import { resolveGatewayUrl } from "$lib/apps/connectx/config";
    import { ConnectXSession } from "$lib/apps/connectx/session.svelte";
    import { cn } from "$lib/utils";
    import GameRoom from "./game-room.svelte";
    import Lobby from "./lobby.svelte";
    import Welcome from "./welcome.svelte";

    // Where the gateway is: `PUBLIC_CONNECTX_URL` if it is set, otherwise on the host of the API (see the README
    // of the site). Since the first is optional, the variables are read by name instead of imported.
    const env = publicEnv as Record<string, string | undefined>;
    const gatewayUrl = resolveGatewayUrl(env["PUBLIC_CONNECTX_URL"], env["PUBLIC_API_BASE_URL"]);

    const session = new ConnectXSession(gatewayUrl);

    // A link can ask to join a room: `?room=Name`. It is read on arrival, in the browser.
    let invite = $state<string | null>(null);

    onMount(() => {
        invite = new URL(window.location.href).searchParams.get("room")?.trim() || null;
    });

    onDestroy(() => session.dispose());

    // When a screen takes the place of another, the visitor starts reading it from the top
    let container = $state<HTMLDivElement | null>(null);
    let shownPhase = session.phase;

    $effect(() => {
        const phase = session.phase;

        if (phase === shownPhase) return;
        shownPhase = phase;

        if (container && container.getBoundingClientRect().top < 0) {
            const calm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
            container.scrollIntoView({ block: "start", behavior: calm ? "auto" : "smooth" });
        }
    });

    // Anything the visitor does in the page counts as being there
    function touch() {
        session.touch();
    }
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
    bind:this={container}
    class="mx-auto flex w-full max-w-5xl scroll-mt-20 flex-col gap-4"
    onpointerdown={touch}
    onkeydown={touch}
>
    {#if session.notice}
        <div
            role={session.notice.tone === "error" ? "alert" : "status"}
            class={cn(
                "flex items-start gap-3 rounded-lg p-3 text-sm",
                session.notice.tone === "error"
                    ? "bg-destructive/10 text-destructive"
                    : "bg-muted text-foreground",
            )}
        >
            <p class="min-w-0 flex-1 break-words">{session.notice.text}</p>
            <button
                type="button"
                class="-m-1 shrink-0 cursor-pointer rounded p-1 opacity-70 hover:opacity-100 focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none"
                aria-label="Dismiss"
                onclick={() => (session.notice = null)}
            >
                <X class="size-4" />
            </button>
        </div>
    {/if}

    {#if session.phase === "game" && session.game}
        <GameRoom {session} game={session.game} />
    {:else if session.phase === "lobby"}
        <Lobby {session} />
    {:else}
        <Welcome {session} {invite} />
    {/if}
</div>
