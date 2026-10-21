import type { PageLoad } from './$types';

// Everything happens in the browser, so the page is a static file
export const prerender = true;

export const load: PageLoad = ({ url }) => {
    return {
        title: 'Fourier Drawing',
        description: 'Draw anything with rotating circles. Pick a shape or upload a picture and watch the Fourier transform redraw it with epicycles.',
        keywords: 'Fourier transform, epicycles, Fourier series, drawing, FFT, edge detection, interactive',
        // The `image` parameter of the address is for the visitor: search engines get a single page
        canonical: `${url.origin}${url.pathname}`,
    };
};
