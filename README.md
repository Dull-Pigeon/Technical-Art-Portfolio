# Technical Art Portfolio

Existing static portfolio: Node.js renders HTML from JSON. No framework, package installation or backend. YouTube is loaded only after a visitor clicks Play.

## Local development and build

Requires Node.js 20+ and Python 3. From the repository root:

```sh
node scripts/render.mjs
python3 scripts/check_links.py
python3 scripts/audit_public.py
python3 -m http.server 8000 --directory dist
```

Open http://localhost:8000. Stop with Ctrl+C. Edit CSS and refresh; after changing templates or content JSON, rerun the renderer. Never clear `dist`: it also contains authored assets.

## Files to edit

- `content/site.json`: home, About and project listing.
- `content/kinetica.json`: Kinetica copy, public source link, credits and media records.
- `scripts/render.mjs`: shared templates.
- `dist/styles.css`: existing visual system.
- `dist/assets/kinetica/`: optimized Showcase stills, architecture SVG and supplied Shader Graph captures.
- `dist/downloads/project-kinetica-breakdown.pdf`: public final Breakdown.
- `dist/video-config.json`: external Showcase URL.

## Development Notes

`content/notes.json` is an array of published notes. The renderer produces `/notes/` and `/notes/<slug>/`, sorted by publication date (newest first), and adds the latest three to the homepage between Selected Work and About. An empty array shows an empty state; one note is sufficient. Existing project case studies remain the primary portfolio content.

To add a note, append an object with a unique lowercase, hyphen-separated `slug`, an ISO `date` (`YYYY-MM-DD`, the publication date), `project`, `title`, `summary`, `body`, and `media`. `body` contains sections with an optional `heading`, a `paragraphs` array of plain text, and optional `links` (`label` and `url`, with `primary: true` only for an important download). Link order in JSON is preserved; place the primary PDF download before related secondary links. Optional `tags` is an array of strings. Text is escaped by the renderer; HTML and Markdown are not interpreted. Keep published slugs stable and do not silently rewrite old notes when adding new ones.

Use only supplied media. Store note-specific images under `dist/assets/notes/<slug>/`; existing project images may be referenced directly. Optional `hero` and each `media` item use `src`, meaningful `alt`, positive integer `width` and `height`, and optional `caption`. URLs must be site-relative (for example `/assets/notes/<slug>/image.webp`) or HTTPS. Images retain their aspect ratios; optimize supplied files consistently with existing assets. No placeholder imagery or local video.

Each body section may also include an optional `media` array, using the same image fields. It renders after that section's paragraphs, before any related links. Omit `layout` for a full-width figure; use `layout: "portrait"` to center and constrain a tall diagram, or mark two adjacent images `layout: "paired"` for a desktop comparison that stacks at 850px and below. Pairs must contain two adjacent images; a wide technical figure may follow the pair in the same array. The existing hero and end-of-article media arrays remain supported. Keep readable source resolution, use supplied imagery only, and retain original aspect ratios without fixed crops.

For a comparison with one shared caption, use a section media group: `{ "layout": "paired", "images": [firstImage, secondImage], "caption": "Shared comparison caption" }`. Each panel uses `src`, `alt`, `width` and `height`, without its own caption or layout; both prepared images must have identical dimensions. The group renders as one figure with two equal desktop columns and one caption, stacking at 850px and below. Normalize screenshot framing and subject scale before export using faithful crops, proportional resizing or neutral padding; retain technical results and readable parameters. Existing individual paired figures remain supported.

Rerun `node scripts/render.mjs`, then both Python checks above and `node --check scripts/render.mjs` / `node --check dist/external-video.mjs`. Preview the homepage, case study, notes index and note routes at desktop and mobile widths; check images and horizontal overflow. For Pages compatibility, also build and check links with `SITE_BASE_PATH=/Technical-Art-Portfolio`, then regenerate without that variable for local previews. Never clear `dist`. When removing a note intentionally, remove only its generated route as well; the renderer does not delete old output.

Preserve the visual design. Notes describe ongoing work or supplied retrospectives, not finished functionality that has not been demonstrated. Base project claims on supplied project material. The initial Kinetica retrospective uses the existing public content and its frozen-source constraints; its date records this note's publication date, not a project milestone. Confluence notes require real supplied progress, text and media before publication.

## Visual interaction grammar

Interaction styling uses the renderer's shared `action` helper. Text links are the default; opt into the existing filled button only for primary actions, such as Explore case study or the Kinetica Technical Breakdown download. Public selected source, returns, footer links and Development Note navigation stay as text. A note may present its primary PDF download as one button, placed before the related case-study text link. Linked headings provide a single entry without duplicate CTAs. Main navigation stays plain, without arrows or underlines; keyboard focus remains visible. Preserve the existing type, spacing and color system.

| Indicator | Meaning |
| --- | --- |
| → | Internal forward navigation: project, note or index |
| ← | Return to a parent/index page |
| ↗ | External destination outside the portfolio |
| ↓ | Download a file (with a download attribute) |
| ↑ | Back to top |
| ▶ | Video playback, using the existing centered poster play icon |

The helper chooses internal/external arrows from the URL. The shared `back` helper renders `←` plus the parent page/section name only: `Portfolio`, `Selected Work` or `Development Notes`. Do not add ‘Back to’, ‘Return to’ or ‘All’ prefixes. Use title case for `Selected Work` everywhere. All arrows retain the same `.75rem` gap from the text. Site-relative links and absolute links within the portfolio URL are internal. PDF links are downloads; opening an image uses forward navigation. The homepage Development Notes heading opens the index, and the Notes navigation item targets the homepage section. Note pages align with the main content container. Keep completed work dominant and Notes editorial; do not turn whole rows into competing boxed CTAs. The homepage Notes heading/content boundary and Notes/About boundary use the existing thin divider color. Redistribute spacing around the bottom divider without widening the overall gap. Preserve this grammar when extending templates or content.

## YouTube Showcase

The final Project Kinetica Showcase is published on YouTube: [Watch the Showcase](https://youtu.be/U2FNPUOYYns?si=NcpO51QfnYB17_hm). `dist/video-config.json` is the canonical runtime configuration for that URL; no local video is stored in this repository. The two comparison sections use the same film with their existing segment timing from `content/kinetica.json`, and playback uses YouTube's privacy-enhanced embed domain.

Never add MP4s, raw video, Base64 video, Unity files or third-party source assets. Existing optimized stills and technical captures are retained.

## Deployment

GitHub Pages uses **GitHub Actions** as its publishing source. `.github/workflows/pages.yml` validates, builds and deploys `dist` on every push to `main`, and supports manual runs. No personal token or stored deployment secret is required. Pages supplies the repository base path through `SITE_BASE_PATH`; this keeps routes, styles, downloads and images correct under the repository URL. Local builds default to the domain root.

Codex workflow: edit this repository, run the checks above, review the diff, commit and push to `main`; check the Pages workflow completes successfully. Generated HTML is retained for direct previews; Actions rebuilds it before deployment. URL-only updates require only the video configuration change.

`.openai/hosting.json` records the original private Sites identity for reference. It does not control GitHub Pages; do not create another Site or alter the private Unity repository. The former Sites URL is not synchronized by this workflow.

## Maintenance

Read `AGENTS.md`. Run the publication audit before every push; it checks common credential patterns, local paths and forbidden source/video files. Review binary additions manually. This repository starts with a clean snapshot and does not import earlier deployment history. No blanket redistribution license is granted to portfolio media or third-party assets.
