# RN-09f preference UI

Source age `10601:5908`, activities `10601:6057`, distracting apps `10601:5968`,
inline gender `10601:6146`; read-only Figma session
`81abaa02-0cf1-4cd0-b22f-25ecb77f4a7f`. Reuse shared editor controls, Field, Button,
Screen and source-sized original SVGs. Missing pack node filenames use the exact
context-provided original download, recorded in the manifest; no substitutes.

All options/current values are supplied props. No age bounds, required demographic,
gender ontology or installed/most-used app catalog is inferred from source samples.
Age selection is a bounded accessible radio list instead of a platform-specific
wheel; null is an explicit optional choice. Activities preserve raw custom text
when deselected and block blank selected custom text. Source samples are dev-only.

App search filters the supplied permitted display catalog, preserving selections
outside the filter and counting all selected IDs. IDs never contain iOS opaque
selection tokens. The separate native branch delegates a real choose intent only
when supplied; no native picker or selection success is simulated by this UI.
The actual `/settings/[field]` routes offer unavailable inputs and no save callback;
unknown fields return a bounded unavailable view, never a fixture.

`SettingsScreen.inlineEditor` reuses the source accordion placement for gender and
later plan controls. It is a controlled slot; owner handles opening/closing, draft,
validation, conflicts/reconciliation and actual data. No autosave or optimistic
summary update occurs. Field/search labels remain persistent; Source icons retain
original roots. Save guards/dirty confirmation are shared with RN-09e. Target and
contrast adaptations follow RN-10, with additional Prefer not to say controls.

Real demographic launch policy, native authorized selection, profile/activities
persistence/schema, account-generation guard/reset, calendar scope and signed-device
validation remain RN09D-D01–D04. Future production editors must be inside real Auth
and keyed account scope; source-frame completion is not integration acceptance.


## Native local selection transactions

`NativeAppsEditor` consumes an explicit owner/SelectionEditorPort and reuses
AppsEditor. It separates native picker staging from editor Save/Discard, decodes
count-only draft metadata, fences scope changes and handles conflicts/uncertain
saves through explicit reload. Owner keys do not authenticate users. The current
Android producer is debug-only and is exercised by Saved apps editor in the
isolated native QA host, not the production Router. No fallback anonymous owner,
backend mutation, installed rule or new native capability is implied. See the
[transaction contract](../../../../../docs/architecture/native-global-selection.md).
