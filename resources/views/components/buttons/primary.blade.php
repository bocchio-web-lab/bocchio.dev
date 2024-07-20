<button
    {{ $attributes->merge(['type' => 'button', 'class' => 'inline-flex items-center px-4 py-2 bg-app-color border border-transparent rounded-md font-semibold text-xs text-gray-700 uppercase tracking-widest hover:bg-app-color focus:bg-app-color active:bg-app-color focus:outline-none focus:ring-2 focus:ring-app-color focus:ring-offset-2 transition ease-in-out duration-150']) }}>
    {{ $slot }}
</button>
