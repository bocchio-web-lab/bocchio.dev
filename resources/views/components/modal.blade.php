@props(['id' => 'modal'])

<div id="{{ $id }}"
    class="hidden fixed z-50 top-0 left-0 w-screen h-screen rounded-lg shadow-xl transition-all bg-gray-500 bg-opacity-85 p-4 justify-center items-center content-center">

    <div class="max-w-xl bg-white p-4 m-auto rounded-md">
        {{ $slot }}
    </div>

</div>
