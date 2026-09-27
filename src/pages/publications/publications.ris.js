import { publications } from '../../data/content';

export function GET() {
  const body = publications
    .map((publication) => {
      const authors = publication.authors.split(', ').map((author) => `AU  - ${author}`).join('\n');
      return [
        `TY  - ${publication.type === 'conference' ? 'CPAPER' : 'JOUR'}`,
        authors,
        `TI  - ${publication.title}`,
        `T2  - ${publication.venue}`,
        `PY  - ${publication.year}`,
        publication.volume && `VL  - ${publication.volume}`,
        publication.pages && `SP  - ${publication.pages}`,
        publication.doi && `DO  - ${publication.doi}`,
        publication.doi && `UR  - https://doi.org/${publication.doi}`,
        ...publication.tags.map((tag) => `KW  - ${tag}`),
        'ER  -',
      ]
        .filter(Boolean)
        .join('\n');
    })
    .join('\n\n');

  return new Response(`${body}\n`, {
    headers: {
      'Content-Type': 'application/x-research-info-systems; charset=utf-8',
      'Content-Disposition': 'attachment; filename="smi-lab-publications.ris"',
    },
  });
}
