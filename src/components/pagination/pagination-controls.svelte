<script lang="ts">
    import * as Pagination from "$components/ui/pagination";

    type OnPageChange = (page: number) => void;

    let {
        count = 0,
        perPage = 10,
        onPageChange,
    }: {
        count?: number;
        perPage?: number;
        onPageChange: OnPageChange;
    } = $props();
</script>

{#if count > perPage}
    <div class="mt-12 flex justify-center">
        <Pagination.Root {count} {perPage}>
            {#snippet children({ pages, currentPage })}
                <Pagination.Content>
                    <Pagination.Item>
                        <Pagination.Previous
                            onclick={() => onPageChange(currentPage - 1)}
                        />
                    </Pagination.Item>

                    {#each pages as page (page.key)}
                        {#if page.type === "ellipsis"}
                            <Pagination.Item>
                                <Pagination.Ellipsis />
                            </Pagination.Item>
                        {:else}
                            <Pagination.Item>
                                <Pagination.Link
                                    {page}
                                    isActive={currentPage === page.value}
                                    onclick={() => onPageChange(page.value)}
                                >
                                    {page.value}
                                </Pagination.Link>
                            </Pagination.Item>
                        {/if}
                    {/each}

                    <Pagination.Item>
                        <Pagination.Next
                            onclick={() => onPageChange(currentPage + 1)}
                        />
                    </Pagination.Item>
                </Pagination.Content>
            {/snippet}
        </Pagination.Root>
    </div>
{/if}
