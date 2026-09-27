import { createHash } from 'node:crypto';

/** The source records contain surnames followed by initials, not full given names. */
export function citationAuthors(authors) {
  return authors.split(', ').map((name) => {
    const match = name.trim().match(/^(.+)\s+([A-Z](?:[A-Z-]*[A-Z])?)$/);
    if (!match) throw new Error(`Cannot split citation author: ${name}`);
    const [, family, initials] = match;
    const given = initials.split('-').map((part) => [...part].map((letter) => `${letter}.`).join(' ')).join('-');
    return { family, given };
  });
}

export function citationKey(paper) {
  const surname = citationAuthors(paper.authors)[0].family.replace(/[^A-Za-z]/g, '');
  const identity = paper.doi || `${paper.type}|${paper.title}|${paper.venue}|${paper.year}`;
  return `${surname}${paper.year}-${createHash('sha256').update(identity).digest('hex').slice(0, 12)}`;
}

export function pageRange(pages) {
  const match = pages.match(/^(\d+)[–—-](\d+)$/);
  return match ? { start: match[1], end: match[2] } : { start: pages, end: '' };
}
