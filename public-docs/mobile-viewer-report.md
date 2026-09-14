# Mobile CUA 20 viewer report

## Result

The Mobile viewer collection contains 20 admitted tasks: 11 lower anchors and 9 upper anchors. Every task has a formal GPT-5.6 screenshot-only CUA trajectory and an exact-gold comparison trajectory, so Mobile is 20/20 paired in the data browser.

The main data browser now presents 82 retained tasks: 33 Web, 29 Game, and 20 Mobile. The Web-plus-Mobile audit contains 87 source tasks and 53 retained tasks; the separate Game catalog contributes 29 retained tasks. The complete trajectory manifest covers 116 Web-audit, Game, and Mobile entries, with 91 paired gold/agent streams. Mobile contributes no missing pair.

## Evidence composition

- Actual agent side: 20 formal screenshot-only GPT-5.6 CUA streams (11 pass, 9 fail).
- Gold side: 14 deterministic exact-gold verifier-frame replays and 6 source-native exact-gold MobileGym runtime replays.
- Generated media: 40 Mobile MP4 files and 40 Mobile posters.
- Synthetic screenshots: none.
- Code-only gate: all 20 tasks are code-only failures by construction.

The six source-native exact-gold runtime replays are candidates 163, 197, 198, 205, 211, and 220. Their source revision, verifier result, capture provenance, trajectories, and frame checksums are retained alongside the media sources.

## Candidate 153 normalization

Candidate 153 is an upper anchor. Its legacy gate report labeled the run infrastructure-invalid because it conflated a protected verifier semantic failure with infrastructure validity. The terminal lane closure separated those conditions and admitted the run as a model-valid CUA failure. This normalization is explicit in the archived provenance and is not silently rewritten.

## Publication

The Mobile extension preserves the current Web/Game viewer architecture, adds a Mobile domain tab and filters, exposes trajectory JSONL beside each media reel, and extends the bounded public-viewer export. The task source packet remains under `new_artifacts/cua-swe-mobile-cua-20-ready/`; only display-safe viewer files are exported publicly.

No Git push was performed while preparing this integration.
