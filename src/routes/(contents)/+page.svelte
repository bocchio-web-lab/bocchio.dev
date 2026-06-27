<script lang="ts">
    import { onMount } from "svelte";
    import { preloadData } from "$app/navigation";
    import { Button } from "$components/ui/button/index.js";
    import { MailIcon, GithubIcon, LinkedinIcon } from "@lucide/svelte";

    onMount(() => {
        preloadData("/projects");
        preloadData("/blog");
    });
</script>

<section
    class="intro--banner flex flex-col items-center justify-center px-6 py-16 md:flex-row md:justify-between md:px-12 lg:px-24"
>
    <!-- Left content -->
    <div class="content-wrapper max-w-xl space-y-6 text-center md:text-left">
        <h1 class="text-4xl font-bold sm:text-5xl md:text-6xl">
            Hey, I'm <span class="block text-primary">Tommaso Bocchietti</span>
        </h1>

        <p class="subtitle text-lg leading-relaxed text-muted-foreground">
            M.Sc. Mechatronics Engineering @ Politecnico di Milano<br />
            Specialized in Dynamics, Control & Embedded Systems
        </p>

        <div class="bio-text space-y-4 text-muted-foreground">
            <p>
                Currently deepening my technical foundation in superconductivity
                and superconducting magnets, aiming to apply my control
                background to the emerging large-scale applications of these
                technologies.
            </p>
            <p class="font-medium text-foreground">
                Currently based in Como, Italy <span>🇮🇹</span>
            </p>
        </div>

        <!-- Social buttons -->
        <div class="social-buttons flex flex-wrap justify-center gap-3 pt-4">
            <Button
                variant="outline"
                class="min-h-12 px-5"
                href="mailto:tommaso.bocchietti@gmail.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Send an email to Tommaso Bocchietti"
            >
                <MailIcon class="mr-2 h-4 w-4" />
                <span>Email</span>
            </Button>

            <Button
                variant="outline"
                class="min-h-12 px-5"
                href="https://github.com/Bocchio01"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Open Tommaso Bocchietti GitHub profile"
            >
                <GithubIcon class="mr-2 h-4 w-4" />
                <span>GitHub</span>
            </Button>

            <Button
                variant="outline"
                class="min-h-12 px-5"
                href="https://www.linkedin.com/in/tommaso-bocchietti"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Open Tommaso Bocchietti LinkedIn profile"
            >
                <LinkedinIcon class="mr-2 h-4 w-4" />
                <span>LinkedIn</span>
            </Button>
        </div>
    </div>

    <!-- Right image -->
    <div class="image-wrapper mt-10 shrink-0 md:mt-0">
        <img
            src="https://res.cloudinary.com/bocchio/image/upload/c_fill,w_320,h_320,g_center/c_limit,w_320/f_auto/q_auto/v1/profile_photo_tommaso_bocchietti_piz_lucendro?_a=E"
            alt="Tommaso Bocchietti"
            width="320"
            height="320"
            fetchpriority="high"
            sizes="(min-width: 768px) 320px, 240px"
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
