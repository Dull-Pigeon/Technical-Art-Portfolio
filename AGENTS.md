# Portfolio maintenance

Read README.md. Scope is this existing portfolio only. Preserve its layout, visual system and copy unless asked to change them. Do not modify or publish the private Project Kinetica Unity project. Implementation claims remain tied to the frozen commit in content/kinetica.json; no new content review is needed for deployment work.

Edit JSON and shared templates, then regenerate HTML. dist/styles.css and dist/assets are authored assets: never clear dist. Preserve supplied identity and stills; do not invent project imagery, contact details or performance claims.

Videos are external YouTube embeds configured by dist/video-config.json. Never add video binaries, encoded video, credentials, local absolute paths, temporary files, Unity files or third-party source assets. Run README checks and inspect the diff before committing. Pushes to main deploy automatically through GitHub Pages Actions. Preserve the original .openai/hosting.json identity; the old private Sites deployment is separate.

Development Notes live in content/notes.json. Add notes through structured data and shared templates; regenerate /notes/, /notes/<slug>/ and the latest three homepage previews with scripts/render.mjs. Note-specific supplied images belong in dist/assets/notes/<slug>/; existing supplied project images can be reused. Include meaningful alt text and real dimensions, preserving aspect ratios. Read README for the body, links, hero, media and optional tags schema.

Preserve the existing visual design and case studies. Notes describe work in progress or evidence-based retrospectives; never invent finished functionality, milestones, dates, results or imagery. Publication dates belong in structured content and are distinct from project event dates. Claims must follow supplied project material, including Kinetica's frozen-source constraints. Do not silently rewrite old notes or change their stable slugs when adding new ones. Do not create Confluence posts without supplied progress. The renderer never clears dist; intentional note removal must also remove only that note's generated route.

Run README validation and JavaScript syntax checks; check Pages base-path builds and internal links, then restore a local-root build. Inspect the homepage, Kinetica page, notes index and individual notes at desktop and mobile widths for broken images and overflow before committing. Respect any session-specific requirement for explicit approval before pushing.

Use the shared action helper for consistent arrow spacing and the filled Explore button for standalone actions. Linked headings consolidate duplicate actions. Use ↓ for downloads, ← for returns, ↗ for destinations and ↑ for the page top; keep navigation free of arrows and link underlines. Preserve the main container alignment on note pages and the Notes navigation target on the homepage. Check the four-item navigation at small mobile widths.
