import type { RequestHandler } from './$types';
import { entries as getProjectEntries } from '../projects/[slug=slug]/+page';
import { entries as getBlogEntries } from '../blog/[[slug=slug]]/+page';

export const prerender = true;

export const GET: RequestHandler = async () => {
    const siteUrl = 'https://bocchio.dev';

    const projectParams = await getProjectEntries();
    const blogParams = await getBlogEntries();
    const staticPages = ['', '/projects', '/apps', '/blog'];

    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
    <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
        ${staticPages.map(page => `
        <url>
            <loc>${siteUrl}${page}</loc>
            <priority>${page === '' ? '1.0' : '0.8'}</priority>
        </url>`).join('')}
        ${projectParams.map(param => `
        <url>
            <loc>${siteUrl}/projects/${param.slug}</loc>
            <priority>0.6</priority>
        </url>`).join('')}
        ${blogParams.map(param => `
        <url>
            <loc>${siteUrl}/blog/${param.slug}</loc>
            <priority>0.6</priority>
        </url>`).join('')}
    </urlset>`.trim();

    return new Response(sitemap, {
        headers: {
            'Content-Type': 'application/xml',
            'Cache-Control': 'max-age=0, s-maxage=3600'
        }
    });
};