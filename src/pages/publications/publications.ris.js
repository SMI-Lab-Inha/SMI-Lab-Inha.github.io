import { publications } from '../../data/content';
import { citationAuthors, pageRange } from '../../lib/citations';

export function GET() {
  const body = publications
    .map((publication) => {
      const authors = citationAuthors(publication.authors).map(({ family, given }) => `AU  - ${family}, ${given}`).join('\n');
      const pages = pageRange(publication.pages);
      return [
        `TY  - ${publication.type === 'conference' ? 'CPAPER' : 'JOUR'}`,
        authors,
        `TI  - ${publication.title}`,
        `T2  - ${publication.venue}`,
        `PY  - ${publication.year}`,
        publication.volume && `VL  - ${publication.volume}`,
        pages.start && `SP  - ${pages.start}`,
        pages.end && `EP  - ${pages.end}`,
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
