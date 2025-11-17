<script lang="ts">
	import { Card } from '$lib/components/ui/card/index';
	import HeaderLogo from './header-logo.svelte';
	import HeaderMenuLinks from './header-menu-links.svelte';
	import HeaderMenuProfile from './header-menu-profile.svelte';
</script>

<header class="sticky top-0 z-50 w-full bg-background/90 backdrop-blur-sm">
	<Card class="p-2 shadow-card-foreground/10">
		<div class="m-auto flex w-full max-w-screen-xl items-center justify-between">
			<HeaderLogo />
			<!-- <HeaderMenuLinks /> -->
			<div class="text-center text-lg font-bold sm:text-xl">Website is under construction...</div>
			<HeaderMenuProfile />
		</div>
	</Card>
</header>
