import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';

export async function GET(context) {
  const articles = await getCollection('articles');
  return rss({
    title: 'MeshTexas Articles',
    description: 'How-to guides, buildout updates, and community news from the MeshTexas network.',
    site: context.site,
    items: articles
      .sort((a, b) => b.data.publishedAt.valueOf() - a.data.publishedAt.valueOf())
      .map((article) => ({
        title: article.data.title,
        description: article.data.description,
        pubDate: article.data.publishedAt,
        link: `/articles/${article.id}/`,
      })),
  });
}
