# Deployment

`next.config.mjs` sets `output: "export"`, so `npm run build` produces a static site
in `out/`. There is no server, no API route and no runtime environment variable, so
any static host can serve it. The build is well under 1 MB.

## GitHub Pages (what this repo is set up for)

Deployment is branch-based: the built site lives on the `gh-pages` branch and GitHub
serves it directly. No CI involved.

One-time setup in the repository:

1. **Settings → Pages → Build and deployment → Source: Deploy from a branch.**
2. Branch **`gh-pages`**, folder **`/ (root)`**, then Save.

To publish, at any time:

```bash
npm run deploy
```

That builds with the right base path, replaces the contents of `gh-pages`, and
pushes. `scripts/deploy-pages.mjs` does the work through a git worktree, so your
working tree is never touched.

The site is served at `https://<owner>.github.io/<repo>/`.

### The base path

A GitHub Pages *project* site is served from `/<repo>`, not the domain root. The
deploy script sets `NEXT_PUBLIC_BASE_PATH` to `/<repo>` at build time (reading the
name from the git remote), which feeds `basePath` and `assetPrefix` in
`next.config.mjs`. Without it every asset would 404.

Share links must respect it too. `lib/basePath.ts` exposes `appUrl()`, and all
generated links go through it — `window.location.origin` on its own would produce
`https://owner.github.io/fill/` instead of `https://owner.github.io/<repo>/fill/`.

`public/.nojekyll` is **required** here. Branch-based Pages deploys run Jekyll, which
ignores directories beginning with an underscore, and would silently drop the whole
`_next/` bundle. The deploy script fails loudly if the file is missing from a build.

Limits on the free plan: 1 GB site size, a soft 100 GB/month bandwidth limit, and a
soft 10 builds/hour limit. Free-plan Pages sites are public.
Source: https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits

## Other free static hosts

To deploy anywhere served from a domain root, build **without**
`NEXT_PUBLIC_BASE_PATH` and publish `out/`.

- **Cloudflare Pages** — build `npm run build`, output directory `out`. Static asset
  requests are free and unlimited; the free plan allows 500 builds/month, 20,000
  files and 25 MiB per file.
  Sources: https://developers.cloudflare.com/pages/platform/limits/ and
  https://developers.cloudflare.com/pages/functions/pricing/
- **Netlify** — now credit-based: 300 credits/month on the free plan with a hard cap,
  where bandwidth costs 20 credits/GB and each production deploy costs 15 credits.
  Sites pause when the credits run out, so it suits a finished site more than one
  under active development. Source: https://www.netlify.com/pricing/

Avoid hosts that require a continuously running server unless server-side code is
added later.

## Supabase phase

Supabase can still be used on free infrastructure:

1. Create a Supabase project.
2. Run `db/schema.sql`.
3. Add public client values to `.env.local`.
4. Replace localStorage persistence with Supabase reads/writes.
5. Enable Row Level Security before storing real user-owned data.

Do not expose `SUPABASE_SERVICE_ROLE_KEY` in the browser.

Note that adding Next.js route handlers would end the static export, and the app
would then need a host that supports Next.js server functions.

## Build checklist

```bash
npm install
npm run test
npm run typecheck
npm run build
```
