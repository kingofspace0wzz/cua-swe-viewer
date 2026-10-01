# Mobile CUA 20 viewer report

## Result

The Mobile viewer collection contains 20 admitted tasks: 11 lower anchors and 9 upper anchors. Every task has paired formal GPT-5.6 and exact-gold GUI media, plus the full coding-and-computer-use activity from the original formal attempt. Mobile coverage is 20/20 for both paired media and full activity.

The main data browser now presents 82 retained tasks: 33 Web, 29 Game, and 20 Mobile. The Web-plus-Mobile audit contains 87 source tasks and 53 retained tasks; the separate Game catalog contributes 29 retained tasks. The complete trajectory manifest covers 116 Web-audit, Game, and Mobile entries, with 91 paired gold/agent streams. Mobile contributes no missing pair.

## Evidence composition

- Actual agent side: 20 formal screenshot-only GPT-5.6 CUA runs (11 pass, 9 fail), with their full activity and 334 screenshots.
- Full activity: 1,778 original JSONL records, represented by 920 ordered item rows: 380 shell commands, 53 edit events, 347 computer-use calls, 131 agent updates, and 9 plans.
- Gold side: 14 deterministic exact-gold verifier-frame replays and 6 source-native exact-gold MobileGym runtime replays.
- Generated media: 40 Mobile MP4 files and 40 Mobile posters.
- Synthetic screenshots: none.
- Code-only gate: all 20 tasks are code-only failures by construction.

The six source-native exact-gold runtime replays are candidates 163, 197, 198, 205, 211, and 220. Their source revision, verifier result, capture provenance, trajectories, and frame checksums are retained alongside the media sources.

## Candidate 153 normalization

Candidate 153 is an upper anchor. Its legacy gate report labeled the run infrastructure-invalid because it conflated a protected verifier semantic failure with infrastructure validity. The terminal lane closure separated those conditions and admitted the run as a model-valid CUA failure. This normalization is explicit in the archived provenance and is not silently rewritten.

## Publication

The original task packet under `new_artifacts/cua-swe-mobile-cua-20-ready/`
excluded raw model runs. On 2026-09-14 the 20 original transcripts were recovered
from their retained EFS attempts. Candidate IDs, selected revisions, models,
run timestamps, every visual trajectory hash, and all 334 screenshot hashes
were checked against the published evidence. The raw transcripts total
24,176,086 bytes and remain in the original EFS runs and the private recovery
archive.

Each task now retains `activity.json`, `activity-provenance.json`, and
`patch.diff` alongside its existing media sources. The activity export retains
every original record, including item starts, updates, completions, and turn
boundaries. Embedded image payloads are replaced by ordered, hash-verified links
to the existing screenshots; execution-machine paths use portable placeholders.
Text is not truncated. The browser groups item lifecycle records into one row
per item, ordered by first appearance, and exposes the complete record data for
download. No replacement attempt or inferred editing action is used.

All 20 transcripts end with `turn.completed`. Candidate 200 has one build
command with a start record but no recorded completion; the browser preserves
its last recorded `in_progress` status and explains the missing completion.
Task outcomes remain the archived protected-verifier results.

Run `python3 scripts/build_mobile_agent_activity.py --check` to verify the
prepared activity, record coverage, hashes, screenshot references, and combined
index. The Game builder preserves compact activity belonging to other domains.
The bounded public export includes the prepared activity and linked artifacts.
