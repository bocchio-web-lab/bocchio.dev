<x-layout-minimal :title="'Content dashboard'" :description="'Dashboard page to perform operation on content'" class="max-w-screen-xl">

    <a href="{{ route('contents.create') }}">
        <x-buttons.primary class="mb-4">Create new content</x-buttons.primary>
    </a>

    <div class="overflow-x-auto">

        <table class="table-auto w-full text-center border-spacing-2 border-collapse">
            <thead>
                <tr>
                    <th>ID</th>
                    <th>Type</th>
                    <th>Published</th>
                    <th class="min-w-80">Title</th>
                    <th>Edit</th>
                    <th>Delete</th>
                </tr>
            </thead>
            <tbody>

                @foreach ($contents as $content)
                    <tr class="border-y">
                        <td>{{ $content->id }}</td>
                        <td>{{ $content->type }}</td>
                        <td>{{ $content->published }}</td>
                        <td>{{ $content->title }}</td>
                        <td>
                            <a href="{{ route('contents.edit', $content->slug) }}">
                                <x-buttons.primary role="link">Edit</x-buttons.primary>
                            </a>
                        <td>
                            <form action="{{ route('contents.destroy', $content->slug) }}" method="post">
                                @csrf
                                @method('DELETE')
                                <x-buttons.danger type="submit">Delete</x-buttons.danger>
                            </form>
                        </td>
                @endforeach

            </tbody>
        </table>
    </div>


</x-layout-minimal>
