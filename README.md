# SMI Lab website

Source for the website of the **Marine Structural Mechanics and Integrity Lab (SMI Lab)**,
Department of Naval Architecture and Ocean Engineering, Inha University.

**Live site:** <https://smil.inha.ac.kr>

The lab works on the structural integrity of ships and offshore structures: ductile fracture
and crashworthiness, the fatigue of floating offshore wind moorings and dynamic power cables,
and the ultimate strength of ship and offshore structures. Research software developed here is
listed on the [software page](https://smil.inha.ac.kr/research/software) and published under
the [SMI-Lab-Inha](https://github.com/SMI-Lab-Inha) organisation.

## Stack

Astro, static output, no runtime framework. Pages are built to plain HTML and served from
GitHub Pages; there is no server and no client-side framework. Deployment runs on push to
`main` through [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml), which type
checks, builds, validates the output, and publishes.

## Content is data, not markup

Every page reads from a JSON file in `src/data/` and renders itself. Adding a paper or a
member means adding one object; no HTML is edited.

| File | Holds |
| --- | --- |
| `site.json` | Lab identity, contact details, navigation tree |
| `director.json` | Biography, education, appointments, author profiles |
| `members.json` | Current members |
| `alumni.json` | Former members |
| `publications.json` | Journal and conference papers, with subject tags |
| `publication-tags.json` | The controlled vocabulary those tags are drawn from |
| `projects.json` | Funded projects |
| `software.json` | In-house packages and their release status |
| `research-areas.json` | Research thrusts and their selected work |
| `teaching.json` | Courses |
| `news.json` | News items |
| `links.json` | External reference links |

Each file is parsed through a [Zod](https://zod.dev) schema in `src/data/content.ts`, so a
malformed entry fails the build rather than reaching the site. The schemas also enforce
cross-file consistency: a research area cannot cite a DOI that no publication carries, and a
publication cannot use a tag that is not in the vocabulary.

Pages whose data file is empty render a visible placeholder naming the file to edit, rather
than silently collapsing.

## Local development

```bash
npm install      # once
npm run dev      # development server on http://localhost:4321
npm run build    # static build into dist/
npm run preview  # serve the built output
```

## Checks

The build is gated on four things, all of which also run in CI:

```bash
npx astro check                      # types and Astro diagnostics
npm run build                        # static build
node scripts/validate-build.mjs      # site-specific invariants
npx html-validate "dist/**/*.html"   # HTML conformance
```

`scripts/validate-build.mjs` checks what a type system cannot: British English in metadata,
colour contrast, heading order, alt text, JSON-LD validity, internal link targets, and the
absence of unresolved placeholders.

## Images

Derived images are committed; originals are not. `scripts/process-images.mjs` regenerates
portraits, favicons and the Open Graph card with [sharp](https://sharp.pixelplumbing.com), and
reads from a local source directory, so it only runs on the lab machine. A normal build never
needs it.

## Conventions

- **UK English throughout**, except in verbatim proper names — a published paper title keeps
  its original spelling, since altering a citation falsifies it.
- **Publication data is transcribed, never reconstructed.** Citations come from a DOI record,
  a BibTeX export, or a CV.
- Acronyms are expanded on first use per page, because visitors arrive on subpages directly.

## Licence

No licence is granted. Lab content — text, photographs and publication records — is
© SMI Lab, Inha University. Please ask before reusing anything here.
