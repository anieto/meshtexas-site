# meshtexas-site

Source for [meshtexas.org](https://meshtexas.org) — the public-facing site for MeshTexas, a community-run MeshCore LoRa mesh network for Texas.

## Stack

[Astro](https://astro.build), static output. Content lives in typed content collections, editable directly in the repo or through a web-based CMS ([Decap](https://decapcms.org)) at `/admin`.

- `src/pages/` — routes (homepage, Connect, About, Articles, Host a Node, Contribute, Search)
- `src/components/` — shared Layout/Header/Footer/Callout components
- `src/content/` — content collections (`articles/`, `host-a-node/`)
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

Anyone can submit an article through `/admin` without needing repo access — [Decap's Open Authoring](https://decapcms.org/docs/open-authoring/) forks the repo for you automatically, and your submission becomes a pull request that an admin reviews before it publishes. See [meshtexas.org/contribute](https://meshtexas.org/contribute) for what the fields mean.

If you'd rather skip the forking step, or want to help review other people's submissions, you can be added as a repo **Collaborator** — this lets you review/approve/merge other people's PRs, though your own submissions still need someone else's approval first, same as anyone without collaborator access. Full **Admin** additionally lets your own submissions publish without waiting on approval, but also grants broader repo access (settings, managing other collaborators) — meant for someone helping run the project day-to-day, not just a regular contributor. Reach out if either sounds useful to you.

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
