# Technical Art Portfolio

Existing static portfolio: Node.js renders HTML from JSON. No framework, package installation or backend. YouTube is loaded only after a visitor clicks Play.

The homepage has one separately approved muted local Kinetica preview; the complete Showcase and case-study excerpts remain on YouTube.

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

`content/site.json` also defines the ordered `focusAreas` array of nonempty labels shared by the homepage intro and every page footer. Update this list once when the portfolio's scope changes; keep the mobile footer scope and back-to-top arrow visible. Native evidence disclosures use a shared marker that changes from `+` to `−` when open.

## Homepage previews

Project records may include a `preview` image (`src`, meaningful `alt`, real positive integer `width` and `height`). Unpublished project image previews also require a site-relative `noteUrl` matching an existing note; optional `previewLabel` describes the supplied stage, such as `Early blockout`. Keep Confluence `published: false`: its secondary image/title open the existing development note, without creating a case-study route or a new primary button. Projects without preview data retain the text presentation. Kinetica remains the dominant completed case study, selected by slug rather than array position.

Homepage project covers must use complete 16:9 source images and 16:9 display frames, without cropping, stretching or added letterboxing. The renderer validates their dimensions and rejects crop parameters. Kinetica's `preview` may additionally specify `video: "/assets/kinetica/homepage-hammer-slime.mp4"`; its existing `src` remains the static poster. This exact video is allowed only for Kinetica's homepage. Confluence uses the separate 1920 × 1080 `/assets/confluence/homepage-blockout.webp`, proportionally reduced from the supplied 3840 × 2160 screenshot; preserve the older note hero. Keep Kinetica's large cover and Confluence's smaller left-image/right-text layout on desktop. On mobile, both covers stack above their text and fill the same content width, without fixed or maximum image widths. Verify file and displayed dimensions when changing records. These cover rules do not apply to article technical images, which retain their original proportions, or alter case-study/YouTube poster framing.

Homepage Development Notes is a text-only editorial list: date, project classification, complete article title, summary and thin dividers, with no thumbnails, shortened titles, image columns or extra buttons. The shared `noteList` uses full titles on both the homepage and `/notes/`; article heroes/bodies/dates/slugs remain unchanged. The homepage still takes the latest three sorted notes, including empty and single-note states. Removing a referenced note also requires updating the project's optional preview/link; never delete images still used by historical articles.

Keep homepage intro spacing and preview styles scoped to homepage classes. The Hero names the work, its supporting line gives engine/study context, and About describes the approach; avoid repeating the same tagline in all three places. Retain student identity, shared focus areas, existing typography and the original palette.

### Local Kinetica preview exception

Only `dist/assets/kinetica/homepage-hammer-slime.mp4` is approved for local video publication. It uses source seconds 0.40–2.40 of the supplied 4.53-second Hammer–Slime clip: a 2.00-second loop retaining a short lead-in, impact, particles, rebound and recovery while removing excess idle time. It is reduced from 3840 × 2160 at 60fps to 1920 × 1080 at 30fps, with no speed change, crop, reverse, padding or new imagery. The 343,328-byte export uses H.264 High / yuv420p, NVENC slow VBR CQ 19, no audio, and MP4 fast start. Keep source recordings and transcode intermediates outside the tracked publication files. The audit allows only this exact path and reviewed SHA-256, with a 6 MB ceiling; replacing it requires a new media review and updated hash, not a wider video allowlist.

`dist/home-preview.mjs` controls this one homepage preview. It assigns the video URL only when playback is requested, with `preload="none"`, muted inline looping and a 50% visibility threshold. Offscreen or background pages pause; manual pause persists across returns. Reduced motion starts with the poster and requires explicit play. A blocked automatic attempt stays on the poster without repeated automatic retries. Keep the always-visible circular 44 × 44 minimum control separate from the project link, using the same round geometry as case-study playback controls, with actual playback events driving its Play/Pause name and icon, visible keyboard focus and no volume/fullscreen/progress controls. Pausing a started preview retains its frame; media failures retain the poster. Keep the full-size poster fallback and reserved 16:9 space when JavaScript or playback is unavailable. The homepage controller must not change the existing YouTube module or excerpt timings.

## Development Notes

`content/notes.json` is an array of published notes. The renderer produces `/notes/` and `/notes/<slug>/`, sorted by publication date (newest first), and adds the latest three to the homepage between Selected Work and About. An empty array shows an empty state; one note is sufficient. Existing project case studies remain the primary portfolio content.

To add a note, append an object with a unique lowercase, hyphen-separated `slug`, an ISO `date` (`YYYY-MM-DD`, the publication date), `project`, `title`, `summary`, `body`, and `media`. `body` contains sections with an optional `heading`, a `paragraphs` array of plain text, and optional `links` (`label` and `url`, with `primary: true` only for an important download). Link order in JSON is preserved; place the primary PDF download before related secondary links. Optional `tags` is an array of strings. Text is escaped by the renderer; HTML and Markdown are not interpreted. Keep published slugs stable and do not silently rewrite old notes when adding new ones.

Use only supplied media. Store note-specific images under `dist/assets/notes/<slug>/`; existing project images may be referenced directly. Optional `hero` and each `media` item use `src`, meaningful `alt`, positive integer `width` and `height`, and optional `caption`. URLs must be site-relative (for example `/assets/notes/<slug>/image.webp`) or HTTPS. Images retain their aspect ratios; optimize supplied files consistently with existing assets. Captioned note figures, including comparisons and disclosed evidence, keep a shared thin outer border and a thin separator above the caption. No placeholder imagery or local video in notes.

Each body section may also include an optional `media` array, using the same image fields. It renders after that section's paragraphs, before any related links. Omit `layout` for a full-width figure; use `layout: "portrait"` to center and constrain a tall diagram, or mark two adjacent images `layout: "paired"` for a desktop comparison that stacks at 850px and below. Pairs must contain two adjacent images; a wide technical figure may follow the pair in the same array. The existing hero and end-of-article media arrays remain supported. Keep readable source resolution, use supplied imagery only, and retain original aspect ratios without fixed crops.

For a comparison with one shared caption, use a section media group: `{ "layout": "paired", "images": [firstImage, secondImage], "caption": "Shared comparison caption" }`. Each panel uses `src`, `alt`, `width` and `height`, without its own caption or layout; both prepared images must have identical dimensions. The group renders as one figure with two equal desktop columns and one caption, stacking at 850px and below. Normalize screenshot framing and subject scale before export using faithful crops, proportional resizing or neutral padding; retain technical results and readable parameters. Existing individual paired figures remain supported.

A full-width section image may include `disclosure: "Supporting evidence / Construction Script logic"` to use the same native, initially closed details/summary treatment as the case study. Preserve its alt text, dimensions and caption; disclosure labels must be nonempty text and cannot be combined with image groups or layout variants. The summary remains keyboard operable with visible focus.

Rerun `node scripts/render.mjs`, then both Python checks above and `node --check scripts/render.mjs` / `node --check dist/external-video.mjs` / `node --check dist/home-preview.mjs`. Preview the homepage, case study, notes index and note routes at desktop and mobile widths; check images, caption frames and horizontal overflow. Check local preview viewport/background pauses, persistent manual pause, reduced motion, failed autoplay, keyboard controls and the separate case-study link. For Pages compatibility, also build and check links with `SITE_BASE_PATH=/Technical-Art-Portfolio`, then regenerate without that variable for local previews. The link check includes lazy `data-src` URLs. Never clear `dist`. When removing a note intentionally, remove only its generated route as well; the renderer does not delete old output.

Preserve the visual design. Notes describe ongoing work or supplied retrospectives, not finished functionality that has not been demonstrated. Base project claims on supplied project material. The initial Kinetica retrospective uses the existing public content and its frozen-source constraints; its date records this note's publication date, not a project milestone. Confluence notes require real supplied progress, text and media before publication.

## Visual interaction grammar

Interaction styling uses the renderer's shared `action` helper. Text links are the default; opt into the existing filled button only for primary actions, such as Explore case study or the Kinetica Technical Breakdown download. Public selected source, returns, footer links and Development Note navigation stay as text. A note may present its primary PDF download as one button, placed before the related case-study text link. Linked project/note headings and the homepage Development Notes heading omit the internal forward arrow, with restrained color hover and visible keyboard focus. Internal filled buttons such as Explore case study also omit the forward arrow; PDF buttons retain their download arrow and attribute. The helper makes this decision only for `heading-link`/`button` roles with an internal forward destination, leaving other arrow semantics intact. Main navigation stays plain, without arrows or underlines. Preserve the existing type, spacing and color system.

| Indicator | Meaning |
| --- | --- |
| → | Ordinary internal text actions; omitted on linked headings and internal filled buttons |
| ← | Return to a parent/index page |
| ↗ | External destination outside the portfolio |
| ↓ | Download a file (with a download attribute) |
| ↑ | Back to top |
| ▶ | Video playback: centered on YouTube posters; the local homepage preview uses a separate bottom-right play/pause control |

External arrows use the Unicode text-presentation selector U+FE0E in the shared helper so mobile browsers retain the text glyph. Preserve the inherited font, color and arrow gap.

The helper chooses internal/external arrows from the URL. The shared `back` helper renders `←` plus the parent page/section name only: `Portfolio`, `Selected Work` or `Development Notes`. Do not add ‘Back to’, ‘Return to’ or ‘All’ prefixes. Use title case for `Selected Work` everywhere. When present, arrows retain the same `.75rem` gap from the text. Site-relative links and absolute links within the portfolio URL are internal. PDF links are downloads; ordinary image-opening text links use forward navigation. The arrowless homepage Development Notes heading opens `/notes/`, while the Notes navigation item targets `/#notes`; do not add a duplicate View all notes button. Note pages align with the main content container. Keep completed work dominant and Notes editorial; do not turn whole rows into competing boxed CTAs. The homepage Notes heading/content boundary and Notes/About boundary use the existing thin divider color. Redistribute spacing around the bottom divider without widening the overall gap. Preserve this grammar when extending templates or content.

## YouTube Showcase

The final Project Kinetica Showcase is published on YouTube: [Watch the Showcase](https://youtu.be/U2FNPUOYYns?si=NcpO51QfnYB17_hm). `dist/video-config.json` is the canonical runtime configuration for that URL. The two comparison sections use the same film with their existing segment timing from `content/kinetica.json`, and playback uses YouTube's privacy-enhanced embed domain. The single homepage preview exception is separate from this complete Showcase.

Apart from the exact reviewed homepage preview above, never add MP4s or other local video, raw recordings, Base64 video, Unity files or third-party source assets. Existing optimized stills and technical captures are retained.

## Deployment

GitHub Pages uses **GitHub Actions** as its publishing source. `.github/workflows/pages.yml` validates, builds and deploys `dist` on every push to `main`, and supports manual runs. No personal token or stored deployment secret is required. Pages supplies the repository base path through `SITE_BASE_PATH`; this keeps routes, styles, downloads and images correct under the repository URL. Local builds default to the domain root.

Codex workflow: edit this repository, run the checks above, review the diff, commit and push to `main`; check the Pages workflow completes successfully. Generated HTML is retained for direct previews; Actions rebuilds it before deployment. URL-only updates require only the video configuration change.

`.openai/hosting.json` records the original private Sites identity for reference. It does not control GitHub Pages; do not create another Site or alter the private Unity repository. The former Sites URL is not synchronized by this workflow.

## Maintenance

Read `AGENTS.md`. Run the publication audit before every push; it checks common credential patterns, local paths and forbidden source/video files. Review binary additions manually. This repository starts with a clean snapshot and does not import earlier deployment history. No blanket redistribution license is granted to portfolio media or third-party assets.
