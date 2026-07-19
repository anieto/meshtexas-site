# meshtexas-site

Source for [meshtexas.org](https://meshtexas.org) — the public-facing site for MeshTexas, a community-run MeshCore LoRa mesh network for Texas.

## Stack

Plain static HTML/CSS/vanilla JS. No build step, no framework, no dependencies.

- `index.html` — homepage (Connect, Coverage, Community sections)
- `about.html` — about page, region-access request info
- `style.css` — shared styles, light/dark theme
- `logo.png` / `logo-wide.png` — site logo assets

## Local development

No build step required — just open the files directly, or serve them locally:

```
npx serve .
```

## Deployment

Hosted on **Cloudflare Pages** (project name `meshtexas-site`, production branch `main`), custom domain `meshtexas.org` (`meshtexas.net` redirects to it). Pushing to `main` triggers a deploy via the Cloudflare Pages GitHub integration — no manual deploy step needed.

## Related

The broker/analyzer infrastructure this site connects to lives in a separate repo, [`meshcore-broker-stack`](https://github.com/anieto/meshcore-broker-stack) (public).

## AI disclosure

It's mixed. I use AI a lot at work. Side projects are a way for me to keep my
programming skills alive. This project contains a mix of manually written and
AI generated (but manually reviewed) code. I used it more heavily in
brainstorming ideas and for managing the GitHub deployment. Don't use this if
you're a purist.
