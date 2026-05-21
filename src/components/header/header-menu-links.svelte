<script lang="ts">
    import { page } from "$app/stores";
    import { derived } from "svelte/store";

    const navItems = [
        { href: "/projects", label: "Projects" },
        // { href: '/apps', label: 'Apps' },
        { href: "/blog", label: "Blog" },
    ];

    const currentPath = derived(page, ($page) => $page.url.pathname);
</script>

<nav>
    <ul class="flex gap-4 sm:gap-8">
        {#each navItems as { href, label }}
            <li>
                <a
                    {href}
                    class="text-center text-lg font-bold hover:text-primary sm:text-xl"
                    class:text-primary={$currentPath.startsWith(href)}
                >
                    {label}
                </a>
            </li>
        {/each}
    </ul>
</nav>
