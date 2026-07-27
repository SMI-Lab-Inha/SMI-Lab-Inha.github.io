import { recruitment, type NewsItem } from '../data/content';

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
