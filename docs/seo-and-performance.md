**Search targets and performance checks**

The site serves three audiences: prospective graduate researchers, academic peers,
and organisations seeking marine structural assessment expertise. Its search
content is built around evidence already in the publication and project records.

| Destination | Search intent |
| --- | --- |
| Home | SMI Lab, Inha University, marine fracture and fatigue, structural integrity |
| Director | Jae Hoon Seo, 서재훈, Burak Can Cerik; one author with two publishing names |
| Research areas | Ductile fracture, engineering critical assessment, ship crashworthiness, ultimate strength, moorings and dynamic power cables |
| Software | Named packages, offshore wind simulation, cable mechanics, OpenFAST tools |
| Publications | Exact paper titles, author lists and DOIs, including CableDyn article 128332 |
| Join us | Graduate research positions, marine structures, Inha University; English and Korean applicant information |

The homepage links to all nine research areas, recent papers, software details,
the director and recruitment. Titles and descriptions identify page subjects.
The canonical origin remains `https://smi-lab-inha.github.io`; institutional
forwarding is not a duplicate hosting origin. News slugs are stored so headline
edits preserve inbound links. News with a photo uses that actual image for sharing.
No incomplete language variants or misleading `hreflang` declarations are emitted.

Search Console and Naver account reports are the places to assess indexing and
queries. Repository verification files do not establish current account access or
ranking. Review branded queries under both director names and topic queries after
crawling; do not infer search success from a Lighthouse score. The approach follows
[Google's SEO guidance](https://developers.google.com/search/docs/fundamentals/seo-starter-guide).

The site stays static, with self-hosted subset fonts, responsive WebP portraits,
lazy loading for lower-page imagery and small native scripts for navigation and
publication filtering. There is no client-side framework or third-party font request.
Dependencies for browser tests and citation parsing run only in development/CI.

`npm run validate:performance` enforces size limits: 12KB gzipped home HTML,
8KB inline executable home JavaScript, 24KB gzipped CSS across the site and 80KB
of fonts. `npm run test:browser` verifies the corresponding user-facing behaviour.
Both checks gate deployments. Regenerate font subsets with `node scripts/fetch-fonts.mjs`
after a build when introducing new Korean characters, then rebuild and validate.

Lighthouse mobile and desktop tests are useful lab checks. Real-user performance
also depends on network, device and cache state. Monitor field LCP, INP and CLS when
enough traffic is available, using the [Core Web Vitals definitions](https://web.dev/articles/vitals).
