<select
    {{ $attributes->merge(['class' => 'shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-offset focus:ring-app-color disabled:opacity-75 disabled:bg-gray-200']) }}>
    {{ $slot }}
</select>
