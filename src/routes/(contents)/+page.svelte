<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import { MailIcon, GithubIcon, LinkedinIcon } from '@lucide/svelte';
</script>

<svelte:head>
	<title>Bocchio</title>
	<meta
		name="description"
		content="Welcome to the personal website of Tommaso Bocchietti, a Mechatronics & Robotics Engineer."
	/>
</svelte:head>

<section
	class="intro--banner flex flex-col items-center justify-center px-6 py-16 md:flex-row md:justify-between md:px-12 lg:px-24"
>
	<!-- Left content -->
	<div class="content-wrapper max-w-xl space-y-6 text-center md:text-left">
		<h1 class="text-4xl leading-tight font-bold sm:text-5xl md:text-6xl">
			Hey, I'm<br />
			<span class="text-primary">Tommaso Bocchietti</span>
		</h1>

		<p class="subtitle text-muted-foreground text-lg leading-relaxed">
			M.Sc. Mechatronics & Robotics Engineering<br />
			Robotics Research @ DLR | Control & Dynamics Enthusiast
		</p>

		<div class="bio-text text-muted-foreground space-y-4">
			<p>
				I'm a passionate engineer with a strong background in system modeling, control theory, and
				robotics. My work bridges mechanical design and intelligent systems, with experience across
				modeling & simulation, control algorithms, and embedded systems.
			</p>
			<p class="location text-foreground font-medium">Currently based in Munich, Germany</p>
		</div>

		<!-- Social buttons -->
		<div class="social-buttons flex flex-wrap justify-center gap-3 pt-4">
			<Button variant="outline">
				<a
					href="mailto:tommaso.bocchietti@gmail.com"
					target="_blank"
					rel="noopener noreferrer"
					class="flex"
				>
					<MailIcon class="mr-2 h-4 w-4" />
					<p>Email</p>
				</a>
			</Button>

			<Button variant="outline">
				<a
					href="https://github.com/Bocchio01"
					target="_blank"
					rel="noopener noreferrer"
					class="flex"
				>
					<GithubIcon class="mr-2 h-4 w-4" />
					<p>GitHub</p>
				</a>
			</Button>

			<Button variant="outline">
				<a
					href="https://www.linkedin.com/in/tommaso-bocchietti"
					target="_blank"
					rel="noopener noreferrer"
					class="flex"
				>
					<LinkedinIcon class="mr-2 h-4 w-4" />
					<p>LinkedIn</p>
				</a>
			</Button>
		</div>
	</div>

	<!-- Right image -->
	<div class="image-wrapper mt-10 shrink-0 md:mt-0">
		<!-- svelte-ignore a11y_img_redundant_alt -->
		<img
			src="https://avatars.githubusercontent.com/u/67842431"
			alt="Profile picture of Tommaso Bocchietti"
			class="h-60 w-60 rounded-full object-cover md:h-80 md:w-80"
		/>
	</div>
</section>

<style>
	/* Optional fade-in animation */
	.intro--banner {
		animation: fadeIn 1s ease-in-out;
	}

	@keyframes fadeIn {
		from {
			opacity: 0;
			transform: translateY(20px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}
</style>
