import { publications } from '../../data/content';
import { citationAuthors, citationKey, pageRange } from '../../lib/citations';

function escapeBib(value) {
  return value.replace(/[{}]/g, (character) => `\\${character}`);
}

export function GET() {
  const body = publications
    .map((publication) => {
      const type = publication.type === 'conference' ? 'inproceedings' : 'article';
      const fields = [
        ['author', citationAuthors(publication.authors).map(({ family, given }) => `${family}, ${given}`).join(' and ')],
        ['title', publication.title],
        [publication.type === 'conference' ? 'booktitle' : 'journal', publication.venue],
        ['year', publication.year],
        ['volume', publication.volume],
        ['pages', pageRange(publication.pages).end ? `${pageRange(publication.pages).start}--${pageRange(publication.pages).end}` : publication.pages],
        ['doi', publication.doi],
        ['keywords', publication.tags.join(', ')],
      ].filter(([, value]) => value);
      return `@${type}{${citationKey(publication)},\n${fields
        .map(([key, value]) => `  ${key} = {${key === 'title' ? `{${escapeBib(value)}}` : escapeBib(value)}}`)
        .join(',\n')}\n}`;
    })
    .join('\n\n');

  return new Response(`${body}\n`, {
    headers: {
      'Content-Type': 'application/x-bibtex; charset=utf-8',
      'Content-Disposition': 'attachment; filename="smi-lab-publications.bib"',
    },
  });
}
