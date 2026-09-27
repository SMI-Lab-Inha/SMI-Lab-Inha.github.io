import { publications } from '../../data/content';

function bibKey(publication) {
  const surname = publication.authors.split(',')[0].split(' ')[0].replace(/[^A-Za-z]/g, '');
  const word = publication.title.split(/\s+/).find((part) => part.length > 4)?.replace(/[^A-Za-z]/g, '') || 'paper';
  return `${surname}${publication.year}${word}`;
}

function escapeBib(value) {
  return value.replace(/[{}]/g, (character) => `\\${character}`);
}

export function GET() {
  const body = publications
    .map((publication) => {
      const type = publication.type === 'conference' ? 'inproceedings' : 'article';
      const fields = [
        ['author', publication.authors],
        ['title', publication.title],
        [publication.type === 'conference' ? 'booktitle' : 'journal', publication.venue],
        ['year', publication.year],
        ['volume', publication.volume],
        ['pages', publication.pages],
        ['doi', publication.doi],
        ['keywords', publication.tags.join(', ')],
      ].filter(([, value]) => value);
      return `@${type}{${bibKey(publication)},\n${fields
        .map(([key, value]) => `  ${key} = {${escapeBib(value)}}`)
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
