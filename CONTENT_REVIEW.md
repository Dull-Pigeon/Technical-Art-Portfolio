# Frozen content review

Reviewed against frozen implementation commit eb011e727cf2e4299ad9a5585ee6a5ecf75b9e35 and the public selected-source repository. No Unity source was modified.

Evidence reviewed: repository tree, all eight C# scripts, three animation clips and their attack events, six ScriptableObject presets, full Shader Graph connections, three VFX prefabs, supplied Breakdown, and final Showcase frame sequences. Video is evidence of visible output only.

## Corrections applied

- Mass × velocity is a momentum-inspired strength, not F = ma.
- Collider deduplication, single-hit SphereCast, attack-window events and non-looping clips are documented accurately.
- Deformation is directly called before the event. VFX and Debug are the subscribers; glancing events still produce material particles.
- The final area-to-deformation-radius mapping is direct, not an unfinished or separately implemented remapping.
- Shader time includes held initial response, damped cosine, a factor of two and negative-lobe rebound scaling. Frequency is an angular rate.
- The VFX spawn offset and surface-normal orientation are recorded; no reflected-velocity effect remains.
- Penetrated/isBroken are classifications, not geometry damage. One impact state per receiver is retained.
- No unmeasured performance claims. 60 fps describes recording, not runtime profiling.
- Final nine-page Breakdown and supplied technical figures were checked before site integration.
- Lin Wenqi / Dull Pigeon identity comes from final film credits; no contact information was inferred.

## Delivered presentation

The site uses representative Showcase stills and an external YouTube player; no video binary is stored in the repository. Website copy remains condensed, while implementation detail lives in the downloadable Breakdown. Reviewer-facing source links point only to the public selected-source repository, whose contents correspond to the frozen implementation.

## External updates

- Set the final YouTube URL in `dist/video-config.json` when supplied. The same configuration powers the main Showcase and timed comparison excerpts.

## Validation

Generated HTML and script syntax; internal files and fragment links; technical figure dimensions; final PDF metadata and page rendering; desktop and mobile browser layouts; repository publication audit.
