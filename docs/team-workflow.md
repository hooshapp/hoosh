# Hoosh team handoff

## Work split

| Owner | Work for this phase | Where to start |
| --- | --- | --- |
| Anisha | AI nudge copy and quest suggestions, iPhone Screen Time and shield behavior, and iPhone QA | `apps/mobile/modules/hoosh-screen-time/` and the iOS extensions in `apps/mobile/ios/` |
| Ishmum | Android QA and fixes, including the Figma shield, permissions, target selection, pause and resume, and nudge timing | `apps/mobile/modules/hoosh-usage/android/` and `apps/mobile/android/` |
| Review together | Shared React Native screens, API and database changes, and product rules for sessions, credits, quests, streaks, and History | `apps/mobile/src/`, `packages/contracts/`, and `services/api/` |

Ishmum can start with the Android path from target selection through opening a shield, leaving the target app, resuming the same session, and hitting the daily cap. Check that saving Settings applies the updated plan, that nudges arrive at the active-use quarters, and that an accepted nudge syncs its credits and quest. Record the build, device, expected result, and actual result for any issue. Anisha can develop AI copy and suggestions in parallel. Agree on the AI inputs and output together before wiring it into the shared flow. Keep timing, blocking, and credit awards in the app's existing rules.

## Branches and pull requests

1. Agree on a starting commit on `integration/shared-product`. The reporting and nudge work is saved locally at `checkpoint/hoosh-reporting-and-nudges` (`c3d0868`). Review its changes and confirm which ones are on the shared branch before using them as the Android QA baseline.
2. Branch from that shared commit for each focused fix. Use names such as `ishmum/android-shield-qa` and `anisha/ai-nudge-copy`.
3. If a fix touches a shared screen, contract, or product rule, agree on the behavior and name one person to implement it. The other reviews it. Keep platform-specific changes in their native modules where possible.
4. Before merging, update the PR branch from `integration/shared-product`. Resolve conflicts by comparing the intended behavior on both sides. Test the changed flow on its platform and verify both platforms when shared behavior changes. List build checks and device checks separately in the PR.
5. Merge reviewed PRs one at a time. Update the remaining branch from the new shared commit and recheck the affected flow.
