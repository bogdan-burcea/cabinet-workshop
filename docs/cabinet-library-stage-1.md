# Portable cabinet templates — Stage 1

Stage 1 implements portable data capture, validation and isolated insertion preparation. Stage 2 has now implemented the approved inheritance integration and library interface; see [the library guide](cabinet-library.md).

## API

`src/workbench/cabinet-template.js` exports:

- `captureCabinetTemplate(state, {cabinetId, name, category, tags, description, materialDescriptions})`: synchronizes a deep clone, captures the effective cabinet, resolves Base dependencies and freezes automatically chosen drawer runners. The caller's project is unchanged.
- `exportCabinetTemplate(template)` and `importCabinetTemplate(json)`: validated JSON storage boundaries; returned objects have no shared references to their inputs.
- `migrateTemplate(input)`: clones and validates schema, generator revision, settings, material roles, hardware manifest, geometry and overrides.
- `instantiateCabinetTemplate(state, template, {policy, overrides, materialsCatalog, availableHardware})`: prepares an isolated project with a fresh cabinet UUID. Default policy is `preserve`; `project` is explicit. Returns separate deep clones in `{state, record, policy}`. Committing `state` must use the existing app Undo transaction against the latest project state. The input project is never mutated, even on failure.
- `TemplateValidationError`: exposes an `issues` array with stable issue codes, messages and field references.

`materialsCatalog`, when supplied, is an array of `{id?, name}` records. Bindings with IDs must resolve by ID, otherwise by exact name. With no catalog the app's existing free-form material names remain self-contained; this does not claim supplier availability. `availableHardware`, when supplied, is an array of `kind:id` capability keys matching the template hardware manifest. Without it, built-in supported selections are checked. No live product-stock lookup is implied.

## Portable payload

The envelope contains `format`, `schemaVersion`, `generatorRevision`, a template ID, name/category/tags/description, cabinet settings, material-role descriptors and a hardware manifest. Material roles are carcass, front, back and drawerBottom. Each stores name, description and optional external ID. There are no machine/tool settings, sheet/nesting settings, prices, run positions, record IDs or UI selections.

Dimensional installation targets stay in the configuration because they determine carcass dimensions and floor-referenced drilling. Project run placement (`x`, layout order, manual/automatic placement) is excluded. Base-aligned lower fronts become explicit standalone section offsets and bottom-reference values. Base-aligned handles become explicit floor-height references. Automatic bought drawer lengths and wooden runner families become the actual selected fitting; insufficient space rejects instead of changing the fitting.

## Inheritance integration

A new persisted `config.settingsPolicy` distinguishes `preserve` and `project`. Existing cabinets without the property retain existing behavior. Preserved instances bypass legacy globals and shared project profiles. Shared changes also leave their operation overrides intact, and selecting one does not overwrite destination installation defaults.

Preserved instances store `config.materialBindings`; `projectParts` uses them when resolving material names, while sheet size and grain/rotation policy remain project-level. The existing project file saves these instance fields, including standalone alignment values.

Preserved instances are revalidated on synchronization, including orphaned operation/banding overrides. The current generator is reused; no alternate geometry path or saved mesh is introduced.

## Migration policy

Current 0.43.0 templates use schema 8 and generator revision `workbench-geometry-8` (published 0.42.0 used schema 5). The pure schema 1 → 2 migration accepts `workbench-geometry-1`, adds inert Shaker/GOLA defaults and preserves existing manufacturing geometry. Schema 2 → 3 adds explicit `splitShelf: true`, `fullDoor: false` and `golaSharedPair: 0`. Cabineo rail fitting positions regenerate from surviving edges with the corrected fitting count; old operation overrides remain subject to validation. Automatic GOLA placement is horizontal for cabinets containing drawers; incompatible explicit vertical settings are reported rather than silently substituted. Schema 3 → 4 adds explicit `drawerInset: false` and `drawerFrontStyle: "slab"`. Rear rails regenerate with one Cabineo at each end. Schema 4 → 5 keeps all settings and applies the corrected exposed divider/front geometry: separate inset fronts use a flush divider with 2 mm reveals; full-height doors still cover a recessed shelf. Schema 5 → 6 adds full-panel/100 mm rear-rail defaults and migrates Tall GOLA covered-tray layouts into split fronts, per the requested no-extreme-rail policy. Schema 6 → 7 adds worktop and independent rail-width settings, with explicit split-GOLA boundary and rear-rail centre-connector geometry regeneration. Schema 7 → 8 explicitly regenerates the corrected rear-rail spacer/fixed-shelf depths and deconflicts dense pantry shelf banks; optional explicit top-drawer shelf clearance is captured instead of lost. Saved overrides must continue to validate. Unsupported older versions, future versions, unknown settings and mismatched generator revisions fail explicitly. A sequential migration registry is defined in the module; add a pure, tested version-to-next-version migration before accepting another schema. Do not fill missing template settings from changing defaults. The generator revision must be bumped whenever its manufacturing semantics change, with explicit geometry migration/approval before older templates are accepted. Existing project-file compatibility is unaffected.

## Stage 2 integration — implemented locally

1. Add a visible instance policy in Cabinet settings. Preserve is the insertion default; Use project defaults is an explicit choice. Report effective hardware/material changes before committing adoption.
2. Route edits of a preserved instance to its local resolved settings, including matched Parts modals. Global controls continue to edit project profiles and identify that preserved instances are excluded. Local controls and matched Parts editors now route through the preserved-instance scope.
3. Show standalone section/handle references as editable local values; do not silently recreate Base links. Any reconnect operation is explicit.
4. Add IndexedDB records with validated/cloned read/write boundaries; name/category/tag search, rename/duplicate/delete and single/batch JSON import/export. Reuse the existing closed-cabinet SVG preview as a regenerable thumbnail cache.
5. Validate insertion using the latest state, present structured issues before commit and assign the prepared state within `update(...)` so Undo/Redo covers the entire insertion. Reject unresolved materials, hardware and orphaned overrides without partial insertion or silently clearing edits.

The user approved this integration before Stage 2 proceeded. The implementation remains local; no deployment or publication is involved.
