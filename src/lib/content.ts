import { recruitment, type NewsItem, type Project, type Publication } from '../data/content';

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

export function publicationAnchor(paper: Publication) {
  return `paper-${paper.id || (paper.doi ? paper.doi.replace(/[^a-zA-Z0-9]+/g, '-') : slugify(paper.title))}`;
}

export function acceptanceLabel(paper: Publication) {
  if (!paper.acceptedDate) return 'In press';
  const date = new Intl.DateTimeFormat('en-GB', {
    day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC',
  }).format(new Date(`${paper.acceptedDate}T00:00:00Z`));
  return `Accepted for publication, ${date}`;
}

// Follows the acknowledgement wording: "supported by <agency>, funded by <funder>".
export function funderLabel(project: Project) {
  return project.agency ? `${project.agency}, funded by the ${project.funder}` : project.funder;
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
    datePublished: paper.inPress ? undefined : paper.year,
    creativeWorkStatus: paper.inPress ? 'Accepted for publication' : undefined,
    isPartOf: { '@type': 'Periodical', name: paper.venue },
    author: paper.authors.split(', ').map((author) =>
      author === 'Seo JH' || author === 'Cerik BC'
        ? { '@id': `${origin}/team/director/#person` }
        : { '@type': 'Person', name: author },
    ),
    about: paper.tags.length > 0 ? paper.tags : undefined,
    isAccessibleForFree: (paper.openAccess && !paper.inPress) || undefined,
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
