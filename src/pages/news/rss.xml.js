import rss from '@astrojs/rss';
import { news } from '../../data/content';
import { newsBody, newsSlug } from '../../lib/content';
import site from '../../data/site.json';

export function GET(context) {
  return rss({
    title: `${site.name} news`,
    description: `Research, publications, people, and opportunities from ${site.fullName}.`,
    site: context.site,
    items: news
      .filter((item) => item.date)
      .map((item) => ({
        title: item.title,
        description: newsBody(item),
        pubDate: new Date(`${item.date}T00:00:00Z`),
        link: `/news/${newsSlug(item)}/`,
      })),
    customData: '<language>en</language>',
  });
}
