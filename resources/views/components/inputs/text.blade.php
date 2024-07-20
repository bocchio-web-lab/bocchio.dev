@props(['disabled' => false, 'readonly' => false])

<input {{ $disabled ? 'disabled' : '' }} {{ $readonly ? 'readonly' : '' }} {!! $attributes->merge([
    'class' =>
        'shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-offset focus:ring-app-color disabled:opacity-75 disabled:bg-gray-200 read-only:opacity-75 read-only:bg-gray-200 read-only:focus:ring-0',
]) !!}>
