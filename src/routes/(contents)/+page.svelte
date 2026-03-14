<script lang="ts">
    import { Button } from "$lib/components/ui/button/index.js";
    import { MailIcon, GithubIcon, LinkedinIcon } from "@lucide/svelte";
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
        <h1 class="text-4xl font-bold sm:text-5xl md:text-6xl">
            Hey, I'm<br />
            <span class="text-primary">Tommaso Bocchietti</span>
        </h1>

        <p class="subtitle text-lg leading-relaxed text-muted-foreground">
            M.Sc. Mechatronics Engineering @ Politecnico di Milano<br />
            Specialized in Dynamics, Control & Embedded Systems
        </p>

        <div class="bio-text space-y-4 text-muted-foreground">
            <p>
                Currently deepening my technical foundation in superconductivity and
                superconducting magnets, aiming to apply my control background to the
                emerging large-scale applications of these technologies.
            </p>
            <p class="font-medium text-foreground">
                Currently based in Como, Italy <span>🇮🇹</span>
            </p>
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
            src="https://res.cloudinary.com/bocchio/image/upload/v1772137489/profile_photo_tommaso_bocchietti_no_background.png"
            alt="Profile picture of Tommaso Bocchietti"
            class="h-60 w-60 rounded-full object-cover md:h-80 md:w-80 scale-x-[-1]"
        />
        <!-- <img
            src="https://res.cloudinary.com/bocchio/image/upload/v1772137489/profile_photo_tommaso_bocchietti.png"
            alt="Profile picture of Tommaso Bocchietti"
            class="h-60 w-60 rounded-full object-cover md:h-80 md:w-80 scale-x-[-1]"
        /> -->
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
