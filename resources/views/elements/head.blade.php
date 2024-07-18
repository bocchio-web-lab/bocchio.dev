@php
    $currentUrl = getenv('APP_URL') . $_SERVER['REQUEST_URI'];
    $currentHost = getenv('APP_URL') . '/';

    $title = ($title ? $title . ' | ' : '') . 'Bocchio\'s WebSite';
    $description =
        $description ??
        'Tommaso Bocchietti. More than just a simple portfolio: a real tour in the Bocchio\'s mind and interest. Articles and portals that goes from programming to engineering.';
    $pageType = $pageType ?? 'website';
    $theme = $theme ?? 'light';
    $ogImageUrl = 'https://bocchio.dev/.netlify/functions/og-image?title=' . $title . '&theme=' . $theme;

@endphp

<head>

    <meta charset="UTF-8">
    <meta name="author" content="Tommaso Bocchietti">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="canonical" href="{{ $currentUrl }}" />

    <meta name="description" content="{{ $description }}">
    <meta name="og:description" content="{{ $description }}">
    <meta name="twitter:description" content="{{ $description }}">
    <meta property="og:title" content="{{ $title }}">
    <meta name="twitter:title" content="{{ $title }}">

    <meta property="og:image" content="{{ $ogImageUrl }}">
    <meta name="twitter:image" content="{{ $ogImageUrl }}">
    <meta property="og:image:alt" content="{{ $title }}">
    <meta name="twitter:image:alt" content="{{ $title }}">

    <meta name="twitter:url" content="{{ $currentUrl }}">
    <meta property="og:url" content="{{ $currentUrl }}">
    <meta name="og:site_name" property="og:site_name" content="Bocchio's Website">
    <meta property="og:type" content="{{ $pageType }}">
    <meta name="twitter:card" content="summary_large_image">

    <link rel="icon" type="image/x-icon" href="{{ asset('favicon.ico') }}">
    <link rel="apple-touch-icon" href="{{ asset('favicon.ico') }}">
    <link rel="shortcut icon" href="{{ asset('favicon.ico') }}">

    <title>{{ $title }}</title>

    @vite(['resources/css/app.css', 'resources/js/app.js'])

</head>
