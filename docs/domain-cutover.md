# `smil.inha.ac.kr` forwarding runbook

Inha University policy permits URL forwarding, not a direct DNS CNAME to
GitHub Pages. Therefore `smi-lab-inha.github.io` remains the site's public and
canonical origin. `smil.inha.ac.kr` is an institutional shortcut and must not
be configured as the GitHub Pages custom domain.

## Current state (verified 27 July 2026)

- `smi-lab-inha.github.io` serves the Astro site over HTTPS.
- `smil.inha.ac.kr` resolves through `cicadmin.inha.ac.kr`.
- HTTP and HTTPS return a small Inha page using an HTML refresh to send visitors
  to the legacy Google Site.

Run `npm run domain:check` to inspect the forwarding behaviour. Failure is
expected until Inha IT replaces the legacy destination.

## Forwarding request

Ask Inha IT to forward `https://smil.inha.ac.kr` to
`https://smi-lab-inha.github.io` with these properties, in priority order:

1. Use an HTTP `301 Moved Permanently` or `308 Permanent Redirect`, not an HTML
   meta refresh, frame, or masked redirect.
2. Preserve the path and query string. For example,
   `https://smil.inha.ac.kr/research/research-areas/?source=inha` should become
   `https://smi-lab-inha.github.io/research/research-areas/?source=inha`.
3. Serve the forwarding endpoint over HTTPS with a valid certificate.
4. Forward HTTP requests to the HTTPS destination as well.

If the institutional system can only forward the home page, use a permanent
redirect to `https://smi-lab-inha.github.io/`. This is less capable but remains
preferable to an HTML refresh.

## Repository configuration

Do not add `public/CNAME`, change Astro's `site`, or change the sitemap address
in `public/robots.txt`. The repository already correctly emits GitHub Pages
canonical URLs. A `CNAME` file is also unnecessary for the custom GitHub
Actions deployment used by this repository.

After IT updates the destination:

1. Run `npm run domain:check`.
2. Test the home page and at least one nested path with a query string.
3. Confirm that the address bar changes to `smi-lab-inha.github.io` and that the
   target page loads over HTTPS.
4. Remove or replace links to the legacy Google Site in university-controlled
   pages and directories.

## Search and profile updates

1. Use `https://smi-lab-inha.github.io` as the canonical property and submit
   `https://smi-lab-inha.github.io/sitemap-index.xml` in Google Search Console.
2. Keep `smil.inha.ac.kr` only as a memorable institutional entry point.
3. Update ORCID, Google Scholar, Scopus, Web of Science, ResearchGate, the Inha
   faculty directory, the GitHub organisation profile, email signatures, and
   software listings to the canonical GitHub Pages origin.
4. Monitor indexing, crawl errors, and branded queries for at least eight weeks
   after the forwarding destination changes.

## Rollback

If forwarding fails, Inha IT can restore the previous destination. No GitHub
Pages or repository rollback is required because the canonical site remains at
the unchanged GitHub Pages origin.
