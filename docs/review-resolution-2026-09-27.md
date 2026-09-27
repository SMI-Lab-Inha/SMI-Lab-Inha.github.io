**Review fixes and validation — 27 September 2026**

The review's eleven numbered findings are addressed:

| Finding | Resolution |
| --- | --- |
| Publication filtering | Hidden rows cannot override visibility; counts and year links follow actual results |
| Citation exports | Structured surname/initial formatting, unique stable keys, protected title case, separate RIS page endpoints |
| Navigation | Explicit disclosure state, desktop/mobile Escape handling, outside-click dismissal and no-JavaScript fallback |
| Keyboard focus | Contrasting focus indicators on dark surfaces |
| Citation links | Inline research citations retain underlines |
| Image scope | Parent scope attributes reach the rendered image, restoring crops and spacing |
| Director schema photo | URL resolves from the actual imported image asset |
| Printing | Print colours override scoped and explicitly selected theme colours |
| Recruitment | Shared inclusive-deadline status, conditional copy and titles, daily refresh |
| Software policy | Availability is stated per package; conflicting release promises removed |
| Proof strip | Four facts use four desktop columns |

The homepage places news and openings early, reduces research-card repetition,
adds recent citations and software descriptions, introduces the director and both
publishing names, compacts member portraits on phones, and consolidates contact
information. Join us leads with openings, funding and application steps, including
a Korean factual summary. The CableDyn citation includes volume 368, Part 2,
article 128332 and DOI 10.1016/j.oceaneng.2026.128332.

Maintenance fixes include stored news slugs, identity and cross-record validation,
real structured-data image checks, accurate inline-JavaScript and language audits,
honest reporting of unverified external URLs, current forwarding documentation,
and performance/browser deployment gates. The Git identity is the owner's configured
identity, with no AI co-author attribution.

Local verification: `npm run validate` passed; four unit tests and 22 browser tests
passed. Browser checks cover 15 principal routes in both colour themes, responsive
homepage widths from 320 to 1440px, citation round trips, navigation, print, images,
and theme persistence. Production dependency audit reported no vulnerabilities.

Local Lighthouse: all four category scores were 100 in both mobile and desktop
tests. Simulated mobile LCP was about 1.21s and desktop LCP about 0.35s, with zero
total blocking time and zero measured CLS in those runs. These are lab observations,
not field guarantees. Home HTML is 7.3KB gzipped, inline executable JavaScript 2.4KB,
all site CSS 6.0KB gzipped, and all font subsets 54.7KB.

At 390px, the homepage measured roughly 6,987px versus 9,612px before; news moved
from about 7,401px to the update section at 690px. The mobile header shrank from
148px to 92px. Desktop height decreased from 5,733px to 4,488px.

Remaining external/editorial opportunities are documented in `owner-inputs.md`:
Search Console account and query checks, optional longer Korean research translations,
and additional original research assets or grant identifiers when supplied. None is
required for the implemented fixes to work.
