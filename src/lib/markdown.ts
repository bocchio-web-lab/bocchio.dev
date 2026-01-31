import { compile } from 'mdsvex';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

export async function processMarkdown(markdown: string): Promise<string> {
    const result = await compile(markdown, {
        remarkPlugins: [remarkMath],
        rehypePlugins: [rehypeKatex],
    });
    return result?.code ? result.code.toString() : '';
}