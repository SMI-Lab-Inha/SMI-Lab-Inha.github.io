# Owner-supplied inputs for the final launch

The site now has complete, publishable fallbacks for every route. The remaining
enhancements cannot be completed responsibly from repository evidence alone.

## Content requiring a lab source

- Add award numbers and official project-record URLs to `src/data/projects.json`
  when the grant documents are available. The schema and project-page rendering
  already support both fields.
- Add real result figures only from approved papers, reports, or lab exports.
  The current diagrams are explicitly labelled as programme and method
  schematics; they must never be described as measured or simulated results.
- Add Korean page copy after a subject-matter expert approves the translation.
  Existing Korean names and titles retain explicit `lang="ko"` markup.
- Set `openUntil` and future intake counts in `src/data/recruitment.json` when a
  firm deadline is approved. Home, News, and Opportunities all derive from this
  one record.
- Add publication-level `preprint`, `code`, or `data` URLs to
  `src/data/publications.json` as those artefacts become public. The list and
  schema already support them.

## Launch actions requiring external access

- Coordinate the institutional URL-forwarding change with Inha IT by following
  `docs/domain-cutover.md`.
- Verify the GitHub Pages origin in Google Search Console, submit its sitemap,
  and monitor indexing after the forwarding destination changes.
- Update ORCID, author profiles, the Inha directory, and the GitHub organisation
  profile to the canonical GitHub Pages origin.

No analytics script is included. This is intentional: the site has no consent
or privacy burden and sends no visitor data to a third party. If usage metrics
become a requirement, select a university-approved, privacy-preserving service
and publish the corresponding privacy notice before enabling it.
