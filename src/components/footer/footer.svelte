<script lang="ts">
    import { Card } from "$components/ui/card/index";

    const currentYear = new Date().getFullYear();
</script>

<footer class="sticky bottom-0 mt-auto w-full border-t bg-background">
    <Card class="rounded-none border-0 py-0 shadow-none">
        <div class="mx-auto w-full max-w-(--breakpoint-xl) px-4 py-4">
            <div
                class="flex flex-row items-center justify-between gap-4 text-sm text-muted-foreground"
            >
                <div>
                    <a href="/" class="">
                        © {currentYear} Bocchio
                    </a>
                </div>
                <nav class="flex gap-6">
                    <a
                        href="/privacy"
                        class="transition-colors hover:text-foreground"
                    >
                        Privacy
                    </a>
                    <!-- <a
						href="/cookies"
						class="transition-colors hover:text-foreground"
					>
						Cookies
					</a> -->
                    <!-- <a
						href="/terms"
						class="transition-colors hover:text-foreground"
					>
						Terms
					</a> -->
                </nav>
            </div>
        </div>
    </Card>
</footer>
