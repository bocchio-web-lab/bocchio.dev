import type { PageLoad } from './$types';
import { loadApp } from '$lib/utils/cms';

// Everything happens in the browser, so the page is a static file.
// The title and the text of the app are in its entry of the CMS, whose slug is the name of this folder
export const prerender = true;

export const load: PageLoad = ({ fetch, url }) => loadApp('chladni-plates', fetch, url);
