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

## Panel refinements — local review, 17 November 2026

- New divided-cabinet drawers can only be selected in the lower section, with drawer system/stock/runner controls directly beneath it. Legacy saved upper drawers retain geometry until explicitly changed to doors/open shelves.
- Cabinet name/style retain accessible names without visible labels/help; tightened the identity spacing. Open accordions use white surfaces with grey controls. Global menu captions are shorter and worktop/back thicknesses are first.
- Missing estimate prices have a warning summary and labeled amber field cues, including additional items. Explicit zero prices remain priced. Parts editing checkboxes use square Carbon styling for unchecked, checked and disabled states, isolated from numeric-field rules.
- Desktop/mobile browser verification passed for these controls, drawing editors, price entry and additional-item cues. Node.js 22: all 546 tests and build pass. Remains local; no push or publication authorized.

## Stock controls, unified fronts and flat dovetails — local review

- Removed the through-feet switch/depth UI; generated and individually edited feet holes now always pass through the stock. Old choice/override keys remain readable but no longer produce blind holes.
- Abbreviated field labels to thick.; paired Global worktop/back fields without help icons; removed stock/door help; normalized placement and Add new layout; moved plinth guidance to help. Fixed Wall→Tall transitions retaining the wall default of no plinth.
- Divided front controls stay in the existing Front & top construction accordion. Hinge counts apply to every section door instead of being forced to two; glass construction notes below stock are removed.
- User confirmed an 8 mm CNC straight end mill. Implemented face-up flat through-dovetails: 20 mm rail tails, matching clearance sockets, 4 mm corner relief radii; no edge dowels. CAD applies polygon cuts and overlapping reliefs sequentially. Source: Vectric round-cutter relief documentation, linked in README. Hardware/costs, Parts, nesting/PDF/DXF, QR snapshots and nested/assembly STEP reflect the new geometry. Legacy rectangle-only NC generation rejects dovetail profiles and directs them to STEP CAM rather than emitting rectangular cuts.
- Automated geometry verification covers 50/70/100 mm frames, 16/18/24 mm stock, banding, connected single solids, no mating overlaps, relief material removal, rotated/mirrored profiles, QR reconstruction and STEP volumes. Desktop/mobile checks passed for controls, Tall plinth, section hinge counts, drawing editors, 3D and actual assembly STEP download. Physical fitting trial remains unverified. No push/publication.

- Final local verification for this refinement: all 550 tests pass on Node.js 22 and the build succeeds. Added blind rebate-corner reliefs so an 8 mm cutter clears the existing pane corners. No push or publication.

## Rounded mating joints, floor support, cross-row swaps and Ixconnect — local review

- Replaced circular dovetail corner holes with one shared rounded seam for rail/stile profiles. Nominal 4.5 mm radii leave room for an 8 mm cutter at up to 1 mm total joint play. Glass rebate reliefs remain. Polygon/CAD, labels, nesting and STEP retain the matched shape; no overlapping mating solids were found.
- Confirmed wallSuspensionApplies had also been used to suppress feet, plinth and foot costs. Those checks now distinguish suspended Wall-style units from floor-standing Base/Tall/Pantry; wall fixing on floor cabinets preserves their normal floor support and height targets.
- Confirmed elevation hit targets were limited to the current row. Added cross-row neighbor swaps with frozen physical positions so a Wall unit may leave an empty floor slot; a swap introducing real overlap is rejected atomically. Verified the screenshot layout with both automatic and manual placement, save/open and Undo/Redo.
- Plinth caption simplified. Parts list has three lines: code/type, name, W/H/D. Long names ellipsize while the full name remains in the accessible cabinet label.
- Added optional Häfele Ixconnect RPC S 15/25, 260.09.765, to Global style joinery and matched drawing modals. Count is per vertical side. Manufacturer catalog FF 2.56 confirms Ø15 × 12.5 mm bores, ≥15 mm stock, ≤6 mm groove, thin 2.5–3.5 mm back and ≥12 mm rear edge distance. The app supports 3 mm back stock; incompatible settings reject atomically. The 50 mm end setbacks/30 mm minimum pitch are application layout choices. No inferred screws or back-panel machining are added; the fitting already includes its screw.
- Verified exact analytic removed volume allowing for the intentional groove intersection, costs, persistence and STEP roundtrip. Desktop/mobile checks cover real drag, Undo/Redo, support/list layout, matched connector editing and actual rounded assembly STEP downloads. Node.js 22: all 556 tests and build pass. Physical hardware/wood fit remains unverified. No push or publication.

## Tall cabinet moved after Base/Wall stack — local repair

- Reproduced the rejection: the previous elevation helper swapped only two X coordinates, placing the Tall into the Wall unit above the Base. The reported layout was valid; the swap algorithm introduced the collision.
- Replaced swapping with column insertion/reflow. Stacked neighbors stay aligned and shift together; extracting a cabinet from a stack creates its own column. Existing horizontal gaps and the run origin are retained. Widths/heights, cabinet IDs and code order stay unchanged. Insertion markers and keyboard navigation use the same column boundaries.
- Regression coverage includes the exact left-Tall-after-Base case, unequal widths with explicit gaps, extracting a stacked cabinet, no-op drops, invalid destinations, original cross-row moves and save/open. Local preview only; no push or publication.
- Verification: Node.js 22, all 560 tests and build pass. Actual pointer dragging, Undo/Redo and column-aware keyboard movement passed at 1440 px and 390 px for both the screenshot arrangement and an unequal-width/gap variant. No push or publication.

## Low feet, Construction and back-fixing clearance — local review

- Implemented 0 mm worktop, 1 mm shared feet and a disabled plinth checkbox below 40 mm actual floor clearance, retaining the saved plinth preference. Verified the existing bottom-lift datum: when feet would leave the side panels below floor, shared foot edits disable incompatible bottom dados rather than changing the height targets.
- Moved cabinet wall fixing below the type selector; simplified Feet/Construction titles, shelf label and door-style prose; added compact section headings and dividers.
- Upper side back connectors now clear actual hanger/rail notches by 50 mm from the bore edge. Added centered top/rear-rail and bottom connectors, with the same clearance validation and manufacturing/cost paths. Narrow cabinets that cannot fit the selected hardware are rejected.
- Node.js 22: 565 tests and build pass, including exact top/bottom bore volume through STEP, save/open, no-worktop targets, low-foot reconciliation and plinth thresholds. Desktop 1440 px/mobile 390 px browser checks passed for controls, placement and Construction styling. Hardware fit remains for physical review. No push or publication.

## Elevation placement, divider Cabineos and drawer heights — local repair

- Confirmed pointer drops always invoked column reordering, retaining stale gaps after narrowing and extracting Base/Wall units instead of allowing them to stack. Clear-space drops now use manual horizontal placement with edge snapping. Actual collisions retain column insertion; keyboard reordering remains available. Undo and saved-project position semantics are preserved.
- Fixed-divider Cabineo housings now enter from its underside; matching side fixing bores move to the same face datum +5 mm. Both Cabineo 8 and 12 are covered.
- Confirmed divided section configs forcibly reset drawerFront values to zero. Added dedicated lower-section front heights used consistently by section geometry, bought-metal previews, hardware planning and save/open. Legacy projects retain equal fronts. Invalid heights still reject through existing drawer validation.
- Removed Equal front heights, the automatic-adjustment blue notice and the blue runner-summary block. Required assembly guidance remains as neutral text.
- Node.js 22: all 569 tests and build pass. Real pointer gap closure and Base/Wall stacking in both directions, Undo/Redo, divided drawer editing/save/reload and drawer cleanup passed at 1440 px and 390 px. Local review only; no push or publication.

## Dependent controls and Base-aligned lower drawers — local review

- Added icon-only left Add action and moved local wall mounting beneath accordions with spacing. Kept plinth/feet/notch/hinge dependent controls visible, disabled and visually muted, including per-door hinge counts.
- Added optional live Base alignment for divided lower sections. Uses first undivided Base with drawers, falling back to first undivided Base. Per user clarification, the lower front top and bottom follow the actual Base front span, including inset/overlay reveals. Lower drawer counts/heights remain editable; the Tall bottom and shared joinery stay unchanged. Existing projects default off; missing Base/insufficient section space reject through validation.
- Added 1–15 shelf holes per bank at 32 mm pitch with a bearing hole. Five remains the legacy default, including old shared profiles without the key; even counts put the extra hole below. Existing fit validation scales to the full bank.
- Replaced assembly checkbox with Connector system/None, preserving the saved assembly boolean for compatibility. Global and matched joinery modals lock groove/dado dependencies. Cost fields use yellow fill without repeated price tags, borders or summary icon.
- Node.js 22: 572 tests and build pass. Regression tests cover both Base front edges, independent drawer heights, inset/overlay alignment after counter changes/save-open, custom hole banks and legacy defaults. Desktop 1440 px/mobile 390 px checks passed for automatic alignment, all inactive field groups, connector locks, icon action, mounting placement and borderless estimate styling. Local only; no push or publication.

- Add cabinet icon alignment: left-anchored the first action with automatic remaining space; duplicate/remove stay on the right. Local preview only.

- Confirmed disabled checkbox rendering defect: the generic disabled input background shorthand erased the tick SVG and hid the bottom border. Excluded checkboxes from that rule and added explicit neutral disabled borders/fill. Verified checked/unchecked states, locked value retention and help at 1440/390 px. Connector system is now the first Global Joinery field, matching the Parts modal. Build passes; local only.

- Reviewed mounting-row spacing: reduced the spacer before its separator to 16 px, inset after the separator to 8 px, and removed the trailing field margin. Verified all four cabinet styles at desktop/mobile widths; build passes. Local only.

- Bottom in dados now follows Connector system directly in Global Joinery and the matched Parts modal. Desktop/mobile field order verified; build passes. Local only.

## Tall handle alignment and divided-door workflow — local repair

- Confirmed a floor handle target below the upper section became a negative local drilling height. Divided front placement now bounds handle centres to each front, preserving the requested shared setting. Drawer pulls remain horizontal and their holes clear the modeled bottom. Unrealistic pitches reject with a direct handle-specific message and correction targets.
- Added handle controls directly under Construction → Doors for split cabinets, reusing the shared style updates. Global and matched Parts handle settings support Base top-handle centre alignment. The reference derives from actual drilling on the first undivided Base; defaults cover no Base/no handle drilling. A divided upper door uses its nearest safe handle position when exact Base-height alignment is outside that door.
- Renamed the split alignment control to Align with base. Removed the extra mounting-row outer margin so the separator follows the accordion rhythm.
- Node.js 22: 575 tests and build pass. Regression tests cover live Base handle centre updates/save-open, upper doors with low/high floor targets, three handle types and overlay/inset hinges. Actual desktop/mobile browser checks passed for direct handle editing, Base reference, Parts modal, concise label and separator spacing. Local only; no push or publication.

## Reusable cabinet library — Stage 1 complete locally; Stage 2 integration checkpoint

- Implemented versioned capture/JSON import/export/migration validation and isolated instantiate preparation. Every boundary clones data; instance UUIDs are fresh. Saved material-role descriptions and effective settings are preserved by default, with explicit project-default adoption.
- Added persisted per-instance settings policy. Preserved instances bypass legacy globals/project profiles, keep their feature overrides through shared changes, and do not overwrite destination installation defaults. Their material bindings feed manufacturing parts. Existing unmarked cabinets retain prior behavior.
- Base-dependent front offsets/bottom references and handle heights become canonical standalone values. Selected automatic runner length/family are frozen to avoid fitting substitution. Missing material mappings, unsupported/unavailable hardware, invalid dimensions and orphaned drilling/banding overrides produce structured issues and no partial insertion.
- Schema 1 and generator revision are explicit; unrecognized versions/settings fail. No historical template format has shipped; future migrations require a tested sequential transformation. Machine/tool, nesting, prices, run placement and UI state are excluded.
- Node.js 22: 588 tests and build pass, including 13 new portable-template tests for manufacturing equivalence, independent object boundaries, profile conflicts, standalone aligned geometry, resizing, runner preservation, orphans, mappings, migrations and destination immutability. Prepared projects loaded in desktop/mobile preview with correct Parts and captured material estimates.
- Per the user’s checkpoint, Stage 2 is held: the substantial inheritance integration needs local controls and Parts modal routing for preserved instances, explicit default adoption with a change summary, and clear Global scope. Proposal: docs/cabinet-library-stage-1.md. IndexedDB, thumbnails/search/metadata management and library UI follow that review. Nothing pushed or published.

## Reusable cabinet library — Stage 2 implemented locally

- Added Save to Library and a searchable, category-filtered thumbnail library with name/category/tag/description editing (including rename), duplicate, confirmed delete and single/batch JSON import/export. IndexedDB writes clone and validate records; imports are atomic and receive fresh library IDs. Templates and regenerable SVG thumbnails use separate stores. Export backups preserve unsupported stored records for recovery.
- Implemented local fittings/material controls for preserved instances and scoped matched Parts edits. Global profile readers exclude preserved instances and explain their scope. Local edits retain overrides, and explicit removal controls are available when an override would become unmatched. Preserved direct drawer edits do not run legacy automatic fitting substitution.
- Added reviewed, validated and Undoable policy adoption. Project-default insertion/adoption resolves destination defaults before activating the template, including untouched defaults. Material-name changes are shown. Insertion prepares against the latest state inside the existing Undo transaction; invalid dimensions or orphaned overrides never partially insert.
- Explicit Base reconnection clears standalone offsets. Legacy projects continue using existing project profiles. Library dialogs use Carbon/Plex/icons, shared label/row spacing and matching help controls. Keyboard Undo does not act on the project behind a library dialog.
- Node.js 22: all 596 tests and build pass, including eight new integration tests for local/shared scope, matched Parts changes, policy isolation/save-open, orphan blocking, atomic JSON parsing, trimmed material roles and untouched destination defaults. Real desktop 1440 px/mobile 390 px Chrome/IndexedDB checks passed for save/search/filter/rename/duplicate/delete, single and batch import/export, thumbnail regeneration, both insertion policies, Undo/Redo, local controls, Parts handle editing, adoption review and persistence after reload. Additional checks verify invalid-batch rollback, future-record backup, capacity rejection and browser-storage denial without breaking the project.
- Guide: docs/cabinet-library.md. Library data stays in the browser/origin; JSON backups are portable. No server, push, publication or deployment.

## Cross-instance and handle audit — confirmed bugs repaired locally

- Reproduced the reported drawer-template → width edit → Wall conversion. Keeping original drawer hardware could produce an overlong-runner error; a short-depth configuration also reproduced a bottom handle hole crossing the new Wall drawer bottom. Added atomic style-conversion review: Wall door preset by default, or explicit Keep drawers/refit with reviewed changes and pinned final runner selection. Peers, instance IDs and library entries remain intact; existing overrides are retained and must validate.
- Confirmed Global fallback excluded preserved sources only when the selected cabinet was preserved. It now filters preserved sources for all active selections. Fixed back-connector inset calculations and suspension constraints that could use unrelated preserved peers.
- Confirmed divided-drawer Parts handles used cabinet-wide frontMode and edited door placement/floor references. The editor now derives its target from the clicked front and exposes drawer placement for drawers. Added explicit shared-fitting guidance.
- Confirmed repair links opened Global settings for preserved-instance errors. Navigation now respects ownership and explicit Global origin; error messages identify C-codes. Handle errors lead to handle controls, and orphaned overrides lead to explicit override management with readable feature descriptions.
- Confirmed legacy load defaults could share feature-map objects between cabinets; save/load now clone nested data. Global explains why the original project-controlled instance changes while preserved library copies do not, and provides a local-settings shortcut.
- Node.js 22: 604 tests and build pass. Eight new regressions cover profile seeding, connector/suspension peer isolation, load/save aliases, conversions/overrides, drawer editor targeting and repair ownership. Actual three-instance UI sequence passed at 1440/390 px, including conversion rejection/refit, peer comparisons, Global/local changes, error ownership/navigation, divided drawer Parts edits and Undo/Redo. No push or publication.

## Library controls, framed fronts and recessed GOLA — implemented locally

- Save to Library is now icon-only beside Duplicate. Library moved to the black header and replaces New cabinet there. Make unique captures resolved instance settings in Undo; unchecking opens the explicit project-default adoption review.
- Confirmed the glass cut geometry already included the rebate lap; only the 3D/SVG preview used opening dimensions. Previews now show the full pane and Parts lists its cut size. Same-cabinet feature edits retain the orbit camera; a changed cabinet still fits its view.
- Added Shaker doors using the existing rounded dovetail frame and a real recessed wooden infill with editable thickness. Infill is included in manufacturing parts/nesting and STEP, excluded from glass costs and hidden-edge automatic banding. Frame remaining thickness is validated.
- GOLA means a recessed aluminium rail, as confirmed by the user. Added configurable height/depth/access gap/wall/position, front access gaps, carcass clearance cuts, drawer box clearance, purchased generic L/channel solids and cut-length estimates. No handle bores or inferred mounting holes. Initial 56.5 × 27.2 mm envelope follows the Scilm catalogue linked in README; exact extrusion/bracket compatibility is still a fabrication choice. Inset hinges are explicitly rejected. Interrupted notched front edges are excluded from automatic banding.
- Portable schema 2/generator revision 2 includes new fields. Tested pure migration from schema 1 adds only inert defaults and preserves old geometry; unsupported versions remain explicit errors.
- Mobile visual QA exposed overflowing floating orbit controls; assembly now follows the content in a complete readable panel at small widths.
- Node.js 22: 611 tests pass and build passes. Seven new regressions cover glass overlap, Shaker members/infill, GOLA styles and drawer systems, actual box/rail clearance, project/template round trips and migration, and exact-volume STEP round trips for infill, notches and purchased rails. Chrome checks at 1440/390 px pass for header/icons, Make unique, glass size rows, real feature-edit camera retention, Shaker thickness, GOLA Local/Parts edits, costs and full assembly STEP downloads. No push, publication or deployment.

## Tall pantry layouts, shared GOLA and Cabineo clearance — implemented locally

- Confirmed the reported collision: automatic Pantry GOLA chose a vertical rail despite recessed trays. Automatic placement is now horizontal whenever drawers are present. Explicit vertical positions are excluded from drawer controls and rejected by validation/import. Tray setback must exceed rail recess depth by at least 3 mm.
- Removed Pantry from new cabinet/style profile choices. Tall now supports section splitting with an optional fixed shelf and full-height doors covering recessed lower trays plus upper adjustable shelves. Reuses existing TANDEM/TANDEMBOX inner drawer and 155° hinge geometry, hardware, costs and exports. Existing Pantry records retain a compatibility path rather than losing their saved layout.
- Added per-instance shared GOLA drawer-pair selection, also editable by clicking a GOLA cut in Parts. The upper drawer pulls from below and the lower from above. Redundant gaps/rails are removed; box limits, metal-side clearance, costs and STEP follow the new arrangement. Three exposed drawers can use two rails. Pair selection stays independent of shared handle profiles and survives library capture/insertion and Undo.
- Confirmed rail Cabineo positions were based on the uncut depth and could enter GOLA recesses. Positions now reference the surviving rail edge. Per the user's clarification, rails at least 100 mm deep have two Cabineos at each end (four total); narrower rails have one at each end. Setbacks are clamped to fit while maintaining housing separation and edge clearance. Too little wood is reported explicitly.
- Audited GOLA/Cabineo combinations across all existing styles, both Cabineo variants and 80/100/140 mm rails. Tested wood and metal drawer box bounds against rail envelopes, including shared rails, divided Tall and full-height-door layouts. Existing bore/pocket collision validation remains active; incompatible dimensions and preserved overrides are not discarded.
- Template schema/generator revision 3 adds explicit fixed-divider/full-door/shared-pair defaults through pure sequential migrations from schemas 1 and 2. Older Cabineo rail drillings regenerate with the corrected arrangement; saved overrides must validate. Explicit incompatible vertical GOLA settings produce a correction rather than an inferred fitting change.
- Node.js 22: 619 tests and build pass. Eight new regression tests cover drawer rail restrictions, Tall inner layouts/divider variants, round trips/resizing, shared rails/box clearance, Cabineo/GOLA cut separation/counts, schema 2 migration, tray setback rejection and numeric Parts select parsing/local pair isolation. Updated the existing 100 mm rail expectation to two fittings per end.
- Actual Chrome workflows pass at 1440/390 px: Tall creation, three trays/two shelves, fixed divider on/off, library saving, shared-pair editing through Cabinet and Parts, Undo and assembly STEP with exactly two named rails. Visual checks passed. Local preview remains available; nothing pushed or published.

## Tall/Wall top GOLA removed — local refinement

- Tall, Wall and legacy Pantry no longer offer or generate a horizontal rail at the cabinet top. Existing explicit Top settings resolve to Bottom and show that effective option in the controls; automatic full-height doors over trays use the bottom edge. Tall doors without drawers retain their vertical free-edge/centre placement.
- Full-height exposed drawer stacks use the channel below the first drawer for its bottom pull, with no top finger gap or top rail. A single drawer uses a bottom rail with matching front allowance and box clearance. Rails within divided lower sections remain available below the cabinet top. Base top-rail behavior is retained.
- Added a regression covering automatic/explicit placement, one/three drawers, wooden/metal systems, legacy Pantry, rail bounds and drawer clearance. Desktop/mobile Tall/library/Parts/Undo/STEP workflows pass. No push or publication.

## Rear rail, inset/Shaker drawers and Tall hinge selection — implemented locally

- Rear rails now have one Cabineo at each end (two total), while front rails retain two per end at ≥100 mm depth and one per end below that threshold.
- Added independent inset drawer fronts and slab/Shaker drawer construction. Inset fronts keep 2 mm reveals inside the carcass, boxes/runners move behind front thickness plus 4 mm, and runner choices account for the reduced depth. Divided lower fronts clear the real divider underside by 2 mm. GOLA remains explicitly incompatible with inset drawer fronts.
- Shaker drawer fronts reuse door frame width and panel thickness, with four rounded jointed members and a real wood panel. Fixing pilots select solid stiles/rails clear of rebates, grooves and joints; knob/pull bores stay in solid rails. Parts frame edits update shared dimensions; handle editing recognizes drawer frames instead of editing upper-door placement. Material/export classification and purchased glass remain separate.
- Confirmed Tall full-height-door normalization silently forced a 155° hinge. Tall now retains the selected inset/overlay hinge; legacy Pantry retains its compatibility preset. Inset door machining/placement and fixed-shelf setback regenerate. Non-zero-protrusion hinges add actual wooden runner spacers, at least 25 mm per side, with editable clearance and matched runner drilling. This conservative allowance does not simulate actual hinge arms; trial-fit the bought assembly and prepare spacer attachment separately. No certification of a specific hinge/tray combination is implied.
- Confirmed a resolved Tall inner tray config could recursively re-enter section preparation, leaving Documents empty. The derived config now ends splitting, and preparation/STEP download workflows pass. Guides describe inner trays and actual spacer allowance. Style changes refit the 3D camera; edits within a style retain the view.
- Material bindings now explain their purpose in the panel: saved names/descriptions for carcass/front/back/drawer-bottom roles feed Parts, nesting and estimates. They are independent of panel thickness and unit prices.
- Template schema/generator revision 4 adds explicit overlay/slab drawer defaults through the schema 3 migration. Existing settings, Undo, isolation and validation remain in effect; older Cabineo layouts regenerate with the rear-rail correction.
- Node.js 22: 629 tests and build pass. Nine new regressions cover rear/front counts, inset dimensions/runner offsets, wood/metal Shaker fronts, Tall inset geometry/spacers/save-load, portable insertion and matched Parts edits, schema migration/GOLA rejection, real divider reveals, resolved inner preparation and drawer handle targeting. Desktop/mobile Chrome checks at 1440/390 px pass for inset/Shaker controls, shared frame editing in Parts, Tall inset preset through local and Parts controls, spacers and actual assembly STEP. Nothing pushed or published.

## Exposed inset divider — repaired locally

- Confirmed the fixed-divider inset setback was applied to separate fronts as well as to full-height doors. Exposed dividers now reach the cabinet face; a shelf behind one continuous inset door remains recessed for clearance.
- Separate inset doors now reference the real shelf upper/lower faces, leaving 2 mm reveals instead of virtual full-top/full-bottom allowances. Lower inset drawers retain their real-divider clearance. Updated Align with base's top allowance so the lower front still matches its Base reference.
- Template schema/generator revision 5 explicitly migrates revision 4 without dropping settings or overrides; corrected divider/front geometry regenerates and overrides must validate.
- Node.js 22: 630 tests and build pass. Added a regression for separate inset Shaker doors and inset Shaker drawers, flush shelf depth and exact 2 mm gaps. Existing full-height-door setback and Base-alignment tests pass. Closed inset Shaker views inspected in Chrome at 1440/390 px; no page errors. Preview rebuilt, nothing pushed or published.


## Release 0.42.0

- User authorized publication through the established PR → main → GitHub Pages workflow on 17 November 2026. Reviewed the local library/instance, drawer/front/GOLA, manufacturing/export, layout and Carbon changes. Generated personal example projects remain outside the release commit.
- Storage keys and IndexedDB schema remain unchanged; template migrations are explicit and unreadable library records remain recoverable without deletion.
- Still pending by user request: Blum 155° inset configuration (71B7650/71B7690 with a 9 mm mounting plate). Do not implement until requested; inset zero-protrusion behavior needs application-specific validation.

- Release validation: clean lockfile installation on Node 22, 630 tests, production build and diff whitespace checks pass. Updated fflate to 0.8.3; audit reports zero vulnerabilities. Desktop/mobile isolated Chrome checks pass for version 0.42.0, legacy project loading, unchanged raw schema-1/future library records and recovery export, preserved insertion/Undo/Redo, Add/configure/style-review/save/reload, Parts/3D and Documents. Hosting workflow/configuration unchanged.

## Desktop construction refinements — local review

- Implemented sheet-length plinth runs split at cabinet boundaries, matching assembly export, and foot clearance behind plinths. Foot clearance includes a conservative 30 mm physical envelope.
- Construction and mounting defaults now live in Global per cabinet type. Rear rails are an alternative to a full back; incompatible back connectors and active back-mounted hangers are rejected explicitly.
- Tall GOLA fronts split at internal sections without top/bottom channels. Open cabinet thumbnails, compact library actions, tighter desktop workspace spacing, a clearer nesting summary and colored wireframe accessories are implemented.
- Confirmed unique-mode adoption defect: a latent Global Ixconnect back-inset minimum used a fallback back thickness, so editing the unique cabinet could not repair adoption. The minimum now uses the effective back thickness; regressions cover multiple local values, independent instances and save/load.
- Verified 639 tests, production build and isolated desktop browser workflows, including Make unique adoption/reload, rear-rail controls, library actions, Parts, nesting and wireframe rendering. Mobile review is deferred at the user's request. No push or publication.

- Review adjustment: restored the small workflow tab subtitles (Dimensions & fittings, Machining details, Sheets & materials, Downloads & costs); tighter workspace spacing remains.

## Wireframe and suspension review correction

- Reverted accessory solid coloring: only actual machining edges receive teal in wireframe; bought drawer parts stay neutral and solid shading is unchanged.
- Grouped enable controls with Wall suspension and exposed Base, Wall and Tall profiles. Unique cabinet activation now resolves required hanger back clearance even when no shared hanger group was edited in that transaction.
- Added machining-edge classification and global/unique suspension regressions for all three cabinet types. All 643 tests and the production build pass. Local only.
- Isolated desktop browser check passed: Global suspension profiles for Base/Wall/Tall, unique suspension off/on, and colored machining wireframe; visually reviewed the result.

## Worktops, independent rails and split GOLA — local review

- Confirmed from the supplied project: switching a Base to drawers caused an aligned Tall's lower offset to become about −2.84e−14 mm. This incorrectly enabled a near-zero dado and blocked the whole transaction. Offsets/lifts within numerical tolerance now remain zero; no user bottom settings are changed.
- Confirmed split GOLA sections incorrectly chose independent whole-cabinet edges. Split fronts now share a horizontal channel at the section boundary, with no floor-level or vertical-centre choice. Alignment accounts for the shared finger gap, and purchased profile geometry follows the same placement as the machining.
- Added per-cabinet worktop preview, overhangs and draft modal editing for rectangular/circular openings and appliance-body clearance. Apply is one Undo transaction; Cancel leaves the cabinet intact. Worktop clicks open the editor. Matching openings continue through supports, with explicit GOLA, fixing, side-panel, rail-strength and clearance validation.
- Entire worktop STEP merges adjoining matching tops, splitting at cabinet boundaries up to the configured stock length (default 4100 mm). It also appears in the assembly STEP. Worktops remain separate from cabinet-board nesting/costing. Cross-cabinet openings are not supported; partial circular support-edge openings use polygon machining, while circular worktop openings are exact.
- Four independent rail widths are available in the style profile/local unique settings. Rear rails receive one extra centre Cabineo housing each, with the matching receiver in the top panel/rear top rail and bottom panel. Hardware counts include these fittings.
- Template schema 7 explicitly migrates older records with worktop and rail-width defaults and the corrected geometry; existing overrides still validate.
- Verified 650 tests and production build, actual worktop STEP round-trip volume, global/local rail geometry, persistence/template independence, isolated desktop cutout editing, Undo/Redo, split GOLA controls and a real worktop STEP download. Desktop only; no push or publication.

## Tall interior drawers and Base-only cutout controls — local review

- Worktop cutout editing is available only on Base cabinets. Tall/Wall retain overhang editing, and existing saved non-Base cutouts are preserved through Apply/save/load.
- Tall Front type now offers Doors · interior drawers from ordinary or split layouts. It reuses the full-door tray generator, keeps the selected hinge and provides existing drawer-system/quantity/zone controls.
- GOLA-to-interior conversion reviews ordinary handles and makes the instance unique; peers, Global profiles and saved templates remain unchanged. Full-height double doors also use this reviewed pulls/knobs path. Centre is removed from new Tall GOLA choices; existing saved centre geometry remains loadable without silent hardware replacement.
- Verified project/template round trips for wooden and Antaro inner drawers, source/peer independence, and isolated desktop workflows for cutout restrictions, retained legacy cutouts, interior drawers and double-door handle review. Local only; mobile remains deferred.
- Final validation: all 653 tests and production build pass. Desktop browser review confirms Tall ordinary/split front selection, reviewed unique handle changes, new Centre exclusion, Base-only cutout controls and preservation of legacy Wall cutouts.

## Tall interior audit, global worktop controls and costing — local review

- Added Global worktop overhang profiles with independent storage, preserved-instance protection and exposed-run-end trimming. Interior cabinet seams do not duplicate side overhangs in STEP or costing.
- Cutout rectangles use four edge distances with live derived width/depth; circles show live diameter. Minimums follow stock, individual rail widths, GOLA, screw/Cabineo envelopes and captured-back fittings. These are conservative no-notch bounds; exact geometry and below-worktop clearance still validate. Live draft edits survive adding/removing other cutouts.
- Tall interior doors expose the existing Blum 155° zero-protrusion hinge. Changing this local selector makes the cabinet unique without touching peers or Global hinges. Added a measured top-drawer-to-first-shelf gap, with construction/pin-bank minimums and explicit template preservation.
- Confirmed/fixed audit defects: runner-spacer and fixed-shelf depths used back-panel formulas with rear rails; dense shelf banks produced overlapping extra holes; explicit shelf clearance was omitted from template capture. Required support holes remain; intersecting/conflicting adjustment holes merge or are omitted.
- Verified all 17,280 core combinations (two drawer systems, one/two doors, five hinge choices, three door styles, fixed shelf on/off, one–four drawers, zero–eight upper shelves and two–five hinges), 192 construction/support combinations and 486 wood-stock/bottom/width/depth/hinge boundary cases. Compared 32 matched layouts with legacy Pantry: panel/drilling and purchased assembly geometry match for TANDEM/Antaro. Physically unavailable dimensions/fittings remain explicit errors.
- Added a Worktop cost row in linear metres, missing-price styling, persisted unit prices, CSV output and reconciled cabinet allocation. Quantity uses actual run lengths including exposed overhangs; apertures do not reduce linear length, and waste is separate.
- Template schema/generator 8 explicitly approve corrected rear-rail depths and dense pin-bank geometry; old settings remain loadable and saved overrides must still validate. No storage reset, push or publication. Mobile remains deferred.
- Final validation: all 665 tests pass; production build and diff checks pass. Isolated desktop QA verified Global overhangs, live edge-distance dimensions and persistence, rectangular/circular apertures, worktop price entry and cabinet totals, local 155 hinge selection, explicit shelf clearance and unchanged peer fittings. Representative Tall CAD bodies mesh successfully. No push or deployment.

## Worktop opening / one-side machining false conflict — fixed locally

- Confirmed reproduction: changing a Base profile from rails to a full top with worktop openings falsely raised opposed blind features. Full-thickness rectangular/polygon pockets were treated as blind unless tagged GOLA. Through bores already worked.
- One-side planning now recognizes every true full-thickness flat pocket as reversible. It moves openings to the required Cabineo/groove face without changing blind depths, polygon shape or removed volume. Genuine opposed blind features still fail explicitly.
- Rectangular support openings use rectangular pockets rather than an unnecessary polygon representation; partial circular support-edge openings retain their polygon path.
- Project manufacturing errors now identify the owning cabinet and part, including non-active cabinets. Conflict messages name the actual blind feature groups; correction controls no longer suggest unrelated sheet dimensions. Restored/proposed configurations are distinguished, and corrections to a different unique cabinet target its local settings.
- Verified 669 passing tests plus targeted geometry checks: Cabineo 8/12 tops with rectangle/circle openings, clipped front-rail openings, unchanged CAD volume/inputs, shared profiles across cabinets, and genuine opposed-blind errors with ownership. Production build and isolated browser checks passed for P004 Front rail → Top, nesting and an actual entire-assembly STEP download. Local only; nothing pushed or published.

## Release 0.43.0 — preparation authorized 2026-11-18

- Publish the current reviewed desktop changes through the feature branch, PR checks and normal main-branch Pages deployment. Prior local-only notes above describe their review state before this authorization.
- Release includes worktop geometry/export/pricing, Global construction and overhang profiles, Tall interior controls, desktop UI refinements and manufacturing fixes. Personal kitchen example artifacts remain local.
- Preserve project/library storage, explicit schema migrations, Undo and branch protections. Release checks and live deployment verification are recorded in the release PR.

- Release candidate validation: clean Node 22 npm ci (zero reported vulnerabilities), 669 tests, production build and diff checks passed. Isolated 0.43.0 browser smoke restored a legacy project, migrated/read a schema-5 template, preserved raw legacy/future library records and exports, exercised insertion/Undo and Tall interior creation/reload, and verified Parts/Nesting/cost views without page errors.
