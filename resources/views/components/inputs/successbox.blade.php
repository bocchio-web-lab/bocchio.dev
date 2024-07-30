@props(['messages'])

@if ($messages)
    <ul
        {{ $attributes->merge(['class' => 'text-sm text-green-600 p-1 bg-green-100 border-green-600 rounded border']) }}>
        @foreach ((array) $messages as $message)
            <li>{{ $message }}</li>
        @endforeach
    </ul>
@endif
