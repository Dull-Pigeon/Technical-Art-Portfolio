# Portfolio maintenance

Read README.md. Scope is this existing portfolio only. Preserve its layout, visual system and copy unless asked to change them. Do not modify or publish the private Project Kinetica Unity project. Implementation claims remain tied to the frozen commit in content/kinetica.json; no new content review is needed for deployment work.

Edit JSON and shared templates, then regenerate HTML. dist/styles.css and dist/assets are authored assets: never clear dist. Preserve supplied identity and stills; do not invent project imagery, contact details or performance claims.

Videos are external YouTube embeds configured by dist/video-config.json. Never add video binaries, encoded video, credentials, local absolute paths, temporary files, Unity files or third-party source assets. Run README checks and inspect the diff before committing. Pushes to main deploy automatically through GitHub Pages Actions. Preserve the original .openai/hosting.json identity; the old private Sites deployment is separate.
