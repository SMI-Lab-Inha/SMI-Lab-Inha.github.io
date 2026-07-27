# `smil.inha.ac.kr` cutover runbook

The custom domain must be changed as one coordinated operation. Do not add the
repository `CNAME` file before Inha IT is ready to update DNS: GitHub Pages would
start redirecting visitors to a hostname that does not yet serve this site.

## Current state (verified 27 July 2026)

- `smi-lab-inha.github.io` serves the Astro site over HTTPS.
- `smil.inha.ac.kr` is a CNAME for `cicadmin.inha.ac.kr`.
- HTTP and HTTPS return a small Inha page that refreshes to the legacy Google
  Site; neither serves the new Astro site.

Run `npm run domain:check` to recheck DNS and HTTPS. Failure is expected until
the cutover is complete.

## Coordinated cutover

1. Ask Inha IT to schedule the `smil.inha.ac.kr` DNS change to the GitHub Pages
   target `smi-lab-inha.github.io`. Preserve the current 600-second TTL until
   the migration is stable.
2. Immediately before that DNS change, add `public/CNAME` containing exactly
   `smil.inha.ac.kr` and change Astro's `site` setting to
   `https://smil.inha.ac.kr`.
3. Change the sitemap URL in `public/robots.txt` to
   `https://smil.inha.ac.kr/sitemap-index.xml`.
4. Run `npm run validate`, merge, deploy, and enable “Enforce HTTPS” in the
   GitHub Pages settings once the certificate is issued.
5. Run `npm run domain:check`. Confirm the home page, representative nested
   routes, assets, canonical links, sitemap, RSS feed, and the 404 response.

## Search migration

1. Verify both the old Google Sites property and `smil.inha.ac.kr` in Google
   Search Console.
2. Submit `https://smil.inha.ac.kr/sitemap-index.xml`.
3. Replace the legacy Google Site with a short moved notice. Configure permanent
   redirects for old paths if the platform permits; otherwise link each important
   old page to its closest new destination.
4. Update ORCID, Google Scholar, Scopus, Web of Science, ResearchGate, the Inha
   faculty directory, GitHub organisation profile, email signatures, and software
   listings to the custom domain.
5. Monitor indexing, canonical selection, crawl errors, and branded queries for
   at least eight weeks before removing any remaining legacy content.

## Rollback

If GitHub Pages cannot issue the certificate or serve the domain, revert DNS to
the previous CNAME and remove `public/CNAME` in the same maintenance window.
Restore Astro's `site` and the robots sitemap URL to the GitHub Pages hostname.
