# meshtexas-site

Source for [meshtexas.org](https://meshtexas.org) — the public-facing site for MeshTexas, a community-run MeshCore LoRa mesh network for Texas.

## Stack

[Astro](https://astro.build), static output. Content lives in typed content collections, editable directly in the repo or through a web-based CMS ([Decap](https://decapcms.org)) at `/admin`. **Articles are the exception:** `/articles/*` is served by [Ghost](https://ghost.org) on the MeshTexas server (admin at `write.meshtexas.org/articles/ghost/`), wrapped in this site's layout by `functions/articles/[[path]].js`. The Ghost theme lives in `ghost-theme/`.

- `src/pages/` — routes (homepage, Connect, About, Host a Node, Contribute, Search); `partials/chrome.astro` is the layout the Articles proxy wraps Ghost pages in
- `src/components/` — shared Layout/Header/Footer/Callout components
- `src/content/` — content collections (`host-a-node/`, `learn/`)
- `src/content.config.ts` — collection schemas
- `src/styles/global.css` — shared styles, light/dark theme
- `public/admin/` — Decap CMS config and entry page
- `functions/api/` — Cloudflare Pages Functions handling the CMS's GitHub OAuth login

## Local development

```
npm install
npm run dev
```

`npm run build` also runs [Pagefind](https://pagefind.app) (site search) as a postbuild step automatically.

## Contributing content

Articles are written in Ghost. Anyone can get a writer (Contributor) account by emailing info@meshtexas.org: contributors write and submit drafts, and an admin or editor publishes them. See [meshtexas.org/contribute](https://meshtexas.org/contribute).

To change how articles look, edit `ghost-theme/` (only the article markup and Ghost-specific CSS; the header, footer and stylesheet come from this site automatically), zip it, and upload it in Ghost under Settings → Design → Change theme.

The Host a Node section (property-owner info) is managed directly by MeshTexas admins and isn't open for public submission.

## Deployment

Hosted on **Cloudflare Pages** (project name `meshtexas-site`, production branch `main`), custom domain `meshtexas.org` (`meshtexas.net` redirects to it). Pushing to `main` triggers a build via the Cloudflare Pages GitHub integration — no manual deploy step needed. `main` has branch protection requiring PR review before merge, except for repo admins.

## Related

The broker/analyzer infrastructure this site connects to lives in a separate repo, [`meshcore-broker-stack`](https://github.com/anieto/meshcore-broker-stack) (public).

## AI disclosure

It's mixed. I use AI a lot at work. Side projects are a way for me to keep my
programming skills alive. This project contains a mix of manually written and
AI generated (but manually reviewed) code. I used it more heavily in
brainstorming ideas and for managing the GitHub deployment. Don't use this if
you're a purist.
