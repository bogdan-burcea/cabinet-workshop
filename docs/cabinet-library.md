# Cabinet library

## Save and browse

On the Cabinet tab, use the icon-only **Save to Library** button next to Duplicate below the active-cabinet picker. Give the template a name, category, comma-separated tags and an optional description. Saving captures the active cabinet's resolved manufacturing settings and material-role descriptions without changing the project.

**Library** in the black header opens the thumbnail browser. Search matches name, category, tags and description, with all search terms required. Category filters combine with search. Each card offers Insert, Edit (including rename/category/tags/description), Duplicate, Export and Delete. Deleting a library entry does not change cabinets already inserted into projects.

The library is stored in IndexedDB in this browser and origin, independently of the current project. `localhost:8000` and `127.0.0.1:8000` are separate origins and therefore separate libraries. It does not sync or publish. Keep an exported JSON backup before clearing browser data or moving browsers. A library holds up to 500 entries; a rejected save/import leaves existing records intact.

## Insert and edit

Insertion defaults to **Preserve saved settings**. Width and depth can be adjusted in the insertion dialog. The existing generator validates the result before Insert is enabled; insertion is prepared again against the latest project state when committed. Undo/Redo covers the whole insertion, with a fresh cabinet instance ID.

Preserved cabinets have **Local fittings & materials** in Cabinet settings. These controls and matched Parts editors update only that instance. Global profiles exclude preserved instances. Material names/descriptions remain editable per role. Saved drilling and banding overrides are retained; incompatible changes fail rather than dropping edits. **Saved feature overrides** lets you explicitly remove selected overrides before changing the corresponding panels or fittings.

The **Make unique** checkbox captures current resolved settings for this instance. Unchecking it requests **Use project defaults**; a review shows setting and material-name changes before Apply. Destination defaults are resolved before activating the imported cabinet, including defaults that have not been explicitly edited. Adoption is validated and Undoable; it does not silently discard saved overrides. Standalone Base-alignment values stay standalone; explicitly enabling Align with base reconnects the lower section and clears the standalone offset references.

## Tall pantry layouts and shared rails

New cabinet choices are Base, Wall and Tall. Existing Pantry records remain readable for compatibility. On Tall, enable **Split into sections**, choose whether to **Include fixed shelf**, and enable **Full-height door over inner drawers** for a pantry layout. Set lower tray quantity, section boundary, upper shelf quantity and tray setback. This uses the existing zero-protrusion 155° hinge/tray system; open the doors before pulling trays. Disable full-height doors to configure separate lower/upper fronts.

For exposed drawers with GOLA, **Shared drawer rail** selects adjacent drawers numbered from the top. The upper drawer pulls from below and the lower from above. Pair 1 & 2 removes the top rail; pair 2 & 3 removes the rail above drawer 2. A three-drawer cabinet therefore has two rails. Shared-pair selection belongs to the individual cabinet, including when edited through a GOLA cut in Parts. Vertical GOLA positions are unavailable when the cabinet contains drawers.

## Changing an inserted cabinet’s type

Changing Cabinet style opens a conversion review. A drawer Base converted to Wall defaults to the Wall door-front preset. Choose Keep drawers to retain them; if the old runners or handles no longer fit, explicitly enable Fit drawers to new dimensions and review the changes before Apply. Refitted runners are saved at the actual resulting size. Conversion is Undoable, does not change other instances or the library record, and never silently discards saved overrides.

Global controls still edit project-controlled instances. When a preserved instance is selected, Global identifies the affected C-codes and offers a shortcut to that instance’s local settings. Handle errors and their repair links follow the owning instance, including drawer handles inside divided cabinets.

## Import, export and thumbnails

- **Export** on a card saves one versioned template JSON.
- **Export library** saves all records, including unsupported future records, so they remain recoverable.
- **Import JSON** accepts a single template or a version 1 library bundle, up to 10 MB and 500 templates. The entire batch is validated before writing. Imports receive new library IDs and do not overwrite existing entries.
- Unsupported schemas, hardware, geometry or orphaned overrides are reported. Unreadable existing entries remain available for raw export or explicit deletion; they are not discarded during browsing.
- Thumbnails are a separate IndexedDB cache generated from the current validated configuration using the existing closed-cabinet SVG view. **Regenerate thumbnails** clears that cache and rebuilds it. Templates and JSON exports do not depend on cached images.

Material names/descriptions are self-contained because the current app has no external material catalog. Built-in hardware selections are validated against supported fittings; this is not a supplier-stock check. Stage 1 APIs also accept explicit material/hardware availability lists for future catalog integration.

## Implementation and validation

Portable API and migration contract: [Stage 1 technical notes](cabinet-library-stage-1.md).

- `cabinet-library-store.js`: validated/cloned IndexedDB boundaries, atomic imports, backups and thumbnail cache.
- `cabinet-library-ui.js`: library and policy-review dialogs; latest-state validation before committing through app `update(...)`.
- `instance-settings.js`: local group editing, policy previews and change summaries.
- `project-settings.js`: project-controlled source selection and destination-default resolution.
- `feature-settings.js` and `app.js`: local vs Global control routing, matched Parts editors and explicit override removal.

Regression tests cover isolation, Parts routing, policy previews/save-open, orphan blocking, JSON batch validation and unedited destination defaults. Real-browser checks cover IndexedDB persistence, search/categories, rename/duplicate/delete, single/batch downloads and uploads, thumbnail regeneration, insertion failures, Undo/Redo, local edits, material reviews, future-record recovery, capacity failures and storage denial on desktop/mobile where applicable.
