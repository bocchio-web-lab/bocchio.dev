/** @type {import('tailwindcss').Config} */
export default {
    content: [
        './vendor/laravel/framework/src/Illuminate/Pagination/resources/views/*.blade.php',
        './storage/framework/views/*.php',
        './resources/views/**/*.blade.php',
    ],
    darkMode: 'false',
    theme: {
        extend: {
            colors: {
                'app-color': 'orange',
            },
            fontFamily: {
                heading: ['Catamaran', 'sans-serif'],
                body: ['Roboto Condensed', 'sans-serif'],
            },
            keyframes: {
                'sloganReveal': {
                    '0%': { opacity: 0, 'text-shadow': 'none'},
                    '70%': { opacity: 1, 'text-shadow': 'none'},
                    '100%': { opacity: 1, 'text-shadow': ' -5px 5px 5px hsla(0, 0%, 100%, .5)'}
                },
                'particleReveal': {
                    '0%': { opacity: 0 },
                    '100%': { opacity: 1 }
                },
            },
            animation: {
                sloganReveal: 'sloganReveal 2s linear 1s 1 normal forwards',
                particleReveal: 'particleReveal 2s linear 1s 1 normal forwards',
            }
        },
    },
    plugins: [],
}

