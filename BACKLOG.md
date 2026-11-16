# Pending work

## Consistent form spacing

- Implemented locally for review: shared 8 px label gaps, 16 px field spacing, centered 24 px help buttons, matching picker gaps and additional-cost rows. Changes are limited to `public/carbon.css`.
- Verified at 1440 px and 390 px: all cabinet styles, Global, Parts, Nesting, Documents/costs, help, banding, groove, shelf drilling, hinge and handle dialogs. All 512 tests and the build pass. Awaiting local preview review before any push or publication.
- Audit every panel and dialog for label-to-field spacing, row spacing and info-icon alignment.
- Apply consistent Carbon spacing and alignment through targeted shared-style/component edits; preserve typography, control sizes, accessible labels, focus and help behavior.
- Acceptance: review all workflow panels, Cabinet/Global settings and dialogs at desktop and mobile widths, including wrapped labels and conditional fields; no clipping or overlap. Run tests and build.

## Pantry/Base bottom elevation investigation

- Reproduce and record the differing bottom elevations with the cabinet settings and measured floor references.
- Different bottom-lift settings are a suspected cause, not a confirmed diagnosis. Compare matched settings before changing behavior.
- Trace style defaults, bottom construction/lift, support mode, foot height, installation targets, saved settings and elevation/assembly transforms. Distinguish bottom-panel underside from side-panel bottom.
- Acceptance: document a reproducible explanation supported by source and measurements. If a defect is confirmed, propose a targeted fix with regression coverage for matched and differing lift/support settings, height targets and save/open behavior.

Implement each task on a feature branch with a pull request. No feature changes or publishing are part of the initial setup verification.

## Pantry upper shelf set — implemented locally

- Optional upper shelves above the drawer zone, off by default, with quantity and adjustable pin-hole controls. Uses measured shelf stock and existing manufacturing paths.
- Verified wooden/metal drawer configurations, fit rejection, legacy defaults, save/open, nesting and STEP rows, and desktop/mobile UI. Awaiting local preview review; no push or publication.

- Upper shelves now offer Drawer-to-shelf clearance (mm), measured from the highest drawer wall to the first shelf underside. Existing automatic positions remain until edited; explicit values persist through save/open.

## Custom label size — implemented locally

- Added width and height fields, automatic A4 row/column counts, dynamic skip range, resized label contents and calibration dimensions. Old settings retain 64 × 34 mm defaults.
- Verified desktop/mobile controls, invalid-fit rejection, save/open and pagination; rendered 64 × 34, 48 × 25 and 90 × 50 mm labels at 300 dpi and decoded their QR codes. All 520 tests pass; build succeeds. Awaiting local review.

## STEP bodies — implemented locally

- Export one sheet product with separate named B-rep part bodies instead of per-part components. No sheet-outline DXF, per review direction.
- Verified STEP roundtrip volumes, positions, body names, one-product structure, actual browser download and all three files in the complete pack. All 521 tests and build pass. Fusion import remains for local user review; no push or publication.

## Cabineo 8 / 12 — implemented locally

- Added style-specific surface-mounted carcass connectors, matched housing and mating-face machining, automatic butt-joint selection, editable end setback / maximum 300 mm spacing, fixed-divider support and fitting quantities in costs/hardware CSV. Legacy screw joinery and saved profiles remain compatible.
- Verified both variants across all cabinet styles, one-side transforms and band deductions, fit/interference rejection, saved profiles, nesting, 3D preview and actual STEP download. Analytic scalloped-pocket volume and STEP roundtrip tests verify the cuts. Desktop/mobile UI, Undo/Redo and linked hardware help pass.
- Node.js 22.23.5: all 527 tests and build pass. Physical fitting trial remains for the user; no push or publication.

## Global wall suspension and Add new styling — implemented locally

- Moved suspension from Cabinet build to Global, scoped to existing/future Wall cabinets. Preserves legacy independent selections until edited, reserves compatible captured backs, rejects incompatible joinery edits and retains stock validation.
- Add new is half the field width, transparent with a border/text matching the adjacent icons; text remains left and plus right.
- Desktop/mobile checks cover adding cabinets, shared suspension scope and future walls, Undo/Redo and help. Node.js 22: all 531 tests and build pass. Awaiting local review; no push or publication.

## Wall-rail clearance — implemented locally

- Added shared rail height (30 mm default), projection, top offset and clearance, plus matching through-notches in both Wall sides. New hanger selection enables notches; older saved projects retain their prior geometry until enabled.
- Checked groove/top/bottom clearance, one-side transformations, banding, unchanged other cabinet styles, save/open, future cabinets, rail quantities, analytic removed volume and STEP roundtrip. Desktop/mobile inputs, Undo/Redo, CAD preview and linked notch help pass.
- Node.js 22: all 535 tests and build pass. Rail profile and installed clearances remain user inputs for physical verification. No push or publication.

## Universal wall mounting, Parts editors and inset motion — implemented locally

- Base, Tall and Pantry can opt into wall mounting with a local floor elevation; Wall cabinets remain mounted. Shared suspension, back reservation, rail machining and costs apply to all mounted types; feet and plinths are omitted while their saved settings remain available.
- Rail notch upper edge is now exactly at the underside of the top panel/rear top rail. Retired the independent top-offset control; legacy values no longer displace the notch.
- Parts suspension, joinery/Cabineo and front/glass modals edit source settings atomically; Cancel, validation and Undo/Redo verified at desktop/mobile sizes.
- Confirmed inset collision cause: the preview pivot used the rear door face. Front hinge-edge rotation eliminates measured door/side overlap for both hands and 16/18/24 mm doors, preserving closed geometry. Motion remains illustrative.

## Entire assembly STEP — implemented locally

- Documents download creates one root assembly and one component per cabinet, with named panel bodies. Closed geometry follows elevation positions/order and installed heights, with all backs on wall Y=0. Includes modeled bought glass/metal panels; unmodeled hardware, wall/rail and worktops remain outside the geometry.
- Tests verify component/body hierarchy, actual machined-volume and body-position roundtrip, manual offsets, mounting elevations and cabinet reordering. Export does not require parts to fit nesting sheets.
- Local preview review pending; no push, PR publication, merge or deployment.

- Final verification: Node.js 22.23.5, all 544 tests pass and build succeeds. Desktop/mobile browser checks passed for mounting across all styles, Parts modal edits/Cancel/validation/Undo, inset open/closed views and actual two-cabinet assembly STEP download. STEP import in Fusion remains for user review.

## Control targets, Global suspension and floor-based shelf height — implemented locally

- Removed the extra Parts settings toolbar; clicking matched drawing features still opens validated editors. Suspension feature dialogs edit shared Global parameters; mounting on/off and installed elevation stay in cabinet settings. Wall cabinets now also have a local suspension-machining toggle.
- Confirmed oversized help activation cause: implicit labels targeted the first labelable element, the help button. Explicit input associations limit help activation to its button and make the checkbox label/row clickable.
- Fixed shelf centre input uses the finished floor datum. Explicit floor targets remain stable across feet/mounting changes and save/open; existing saved body-relative shelf positions remain until edited. Fractional local offsets support measured stock and installation elevations.
- Node.js 22: all 546 tests and build pass. Desktop/mobile browser checks cover label/help activation, local/shared suspension, shelf elevation and Undo/Redo, drawing feature edits and removal of the toolbar. Local preview review pending; nothing pushed or published.

## Release authorization — 16 November 2026

- Local preview reviewed; user authorized committing all changes, pushing the feature branch, opening a pull request, merging after checks pass and verifying GitHub Pages. Earlier no-push/local-review notes describe the prior review stage.
- The Pantry/Base bottom-elevation investigation remains pending; different bottom-lift settings remain a hypothesis.
