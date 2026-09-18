import { recruitment, type NewsItem, type Publication } from '../data/content';

export function slugify(value: string) {
  return value
    .normalize('NFKD')
    .toLowerCase()
    .replace(/[’']/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export function newsSlug(item: NewsItem) {
  return slugify(item.title);
}

export function newsBody(item: NewsItem) {
  return item.kind === 'recruitment' ? recruitment.summary : item.body;
}

export function positionsLabel() {
  return recruitment.positions
    .map(({ degree, count }) => `${count} ${degree} ${count === 1 ? 'position' : 'positions'}`)
    .join(' and ');
}

export function recruitmentStatusLabel() {
  if (!recruitment.active) return 'Applications closed';
  if (recruitment.openUntil) {
    const date = new Intl.DateTimeFormat('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(new Date(`${recruitment.openUntil}T00:00:00Z`));
    return `Open until ${date}`;
  }
  return 'Now open';
}

/**
 * schema.org describing a list of papers. Shared by the journal and
 * conference pages so both carry structured data, and so the director
 * resolves to his existing Person node rather than a duplicate name.
 */
export function publicationSchema(items: Publication[], origin: string) {
  return items.map((paper) => ({
    '@type': 'ScholarlyArticle',
    headline: paper.title,
    name: paper.title,
    datePublished: paper.year,
    isPartOf: { '@type': 'Periodical', name: paper.venue },
    author: paper.authors.split(', ').map((author) =>
      author === 'Seo JH' || author === 'Cerik BC'
        ? { '@id': `${origin}/team/director/#person` }
        : { '@type': 'Person', name: author },
    ),
    about: paper.tags.length > 0 ? paper.tags : undefined,
    isAccessibleForFree: paper.openAccess || undefined,
    sameAs: paper.doi ? `https://doi.org/${paper.doi}` : undefined,
    identifier: paper.doi ? `https://doi.org/${paper.doi}` : undefined,
  }));
}

/**
 * Splits a string into Latin and Hangul runs, so mixed labels such as
 * "Inha University — 인하대학교 홈페이지" can mark only their Korean part
 * with lang="ko". A screen reader then switches voice for that run instead
 * of reading Hangul with an English synthesiser, and search engines see the
 * Korean as Korean.
 */
export function splitScript(value: string) {
  return value
    .split(/([\uAC00-\uD7AF][\uAC00-\uD7AF\s]*)/)
    .filter(Boolean)
    .map((part) => ({ text: part, korean: /[\uAC00-\uD7AF]/.test(part) }));
}
