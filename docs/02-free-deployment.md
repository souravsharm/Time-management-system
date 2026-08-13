# Free Deployment Notes

The project is configured with `output: "export"` in `next.config.mjs`, so `npm run build` produces a static site in `out/`.

Recommended non-Vercel targets, checked against official docs on 2026-06-16:

- Netlify: Free plan is listed at $0 with a monthly credit limit. Build command: `npm run build`. Publish directory: `out`. Source: https://www.netlify.com/pricing/
- Cloudflare Pages: Free plan lists 500 builds per month. Build command: `npm run build`. Output directory: `out`. Source: https://developers.cloudflare.com/pages/platform/limits/
- GitHub Pages: available for public repositories on GitHub Free and serves static HTML, CSS, and JavaScript. Best fit if deploying to an owner root site; project sites usually need a Next.js `basePath`/asset prefix for the repository subpath. Source: https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages
- Render Static Sites: Hobby is listed at $0/month and the plan comparison includes Static Sites. Build command: `npm run build`. Publish directory: `out`. Source: https://render.com/pricing

For this MVP, avoid platforms that require a continuously running server unless you are adding server-side Supabase code. The current app runs fully in the browser.

## Supabase phase

Supabase can still be used on free infrastructure:

1. Create a Supabase project.
2. Run `db/schema.sql`.
3. Add public client values to `.env.local`.
4. Replace localStorage persistence with Supabase reads/writes.
5. Enable Row Level Security before storing real user-owned data.

Do not expose `SUPABASE_SERVICE_ROLE_KEY` in the browser.

## Build checklist

```bash
npm install
npm run test
npm run typecheck
npm run build
```

The static export does not use Next.js route handlers. If you later add API routes, switch to a host that supports Next.js server functions, such as Netlify or Render Web Services.
