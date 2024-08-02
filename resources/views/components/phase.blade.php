@props(['phase'])

@isset($phase)
    <span @class([
        'text-xs rounded-full bg-slate-300 text-gray-600 px-2 py-1 before:inline-block before:align-text-top before:w-3 before:h-3 before:mr-1 before:rounded-full',
        'before:bg-white' => $phase == 0,
        'before:bg-red-500' => $phase > 0 && $phase <= 30,
        'before:bg-yellow-500' => $phase > 30 && $phase <= 70,
        'before:bg-green-500' => $phase > 70,
    ])>
        @switch($phase)
            @case(0)
                Just an idea
            @break

            @case(100)
                Completed
            @break

            @default
                In progress ({{ round($phase / 5) * 5 }}%)
        @endswitch
    </span>
@endisset
