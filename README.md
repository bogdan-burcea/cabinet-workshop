# Cabinet Workshop

Browser-based cabinet design, nesting and CNC toolpath preparation.

For GitHub Pages setup and automatic updates, see [GITHUB-DEPLOYMENT.md](GITHUB-DEPLOYMENT.md).

# Cabinet Workshop 0.10

A lightweight, browser-based cabinet-to-toolpath workbench. One base cabinet style is being refined before adding more styles.

## Current workflow

1. **Cabinet:** dimensions, doors, hinge/plate preset, handle holes, shelves, captured back and bottom dados. The explicit **Apply cabinet starter defaults** action restores construction/hardware defaults and one-side machining, while keeping name, body dimensions, material assignments, travel, controller and feeds. Undo restores the previous state.
2. **Parts:** inspect the single **Machining face**, exact bores/grooves and optional separate edge-pilot diagrams. The drawing and generated coordinates use the same face-up frame.
3. **Nesting:** group by material name and thickness. Doors share carcass stock by default, with a separate-finish option. Five deterministic packing orders reduce sheet count without rotating grain unless enabled. PDF/DXF/CSV exports use the actual machining coordinates. This is heuristic packing, not a global optimum.
4. **Toolpaths:** choose individual blanks, nested sheets or optional edge-pilot fixtures. The **Required bits** summary shows actual diameters, tasks and minimum usable reach. **Use suggested bits** applies a simple compatible set; it does not check inventory or replace the physical tool. Face-up orientations and the tool list ship in the setup pack.

## One-side flat machining

Enabled by default, including migration of earlier workbench files. Each panel’s inside, groove or hinge-cup face is placed up. Through holes are cut from that same side. Blind cups, shelf-pin bores and dados retain their specified depths and physical geometry. No blank or sheet flip is needed. The original two-face workflow remains available by disabling **One-side flat machining**.

The manufacturing adapter leaves the assembled model untouched. It selects the face required by non-reversible features, redirects only true through-bores, and rotates original-B panels about Y into a canonical A-up machining frame. Raw geometry, source face and canonical orientation are retained as data. A partial side clearance may be reversed only when its entire bore section terminates at a verified opposite dado floor; the extended bore removes only material already in that relief. Unknown opposed blind features are rejected, never omitted or moved silently.

Nesting uses the canonical face-up features, including reflected edge locations and optional quarter-turn rotations. Check that the stock’s decorative surfaces permit the listed inside/show-face orientation for every part in a mixed sheet. All sheet features finish before separate profile-only files. Individual-part final milling files combine remaining features with the profile. Each cutout retains four tabs.

Default output: 9 panels, 44 bores and 6 grooves. One-side mode makes 13 individual programs or 19 nested programs, with no B files. Default stock is two 1200 × 1200 sheets of 18 mm shared carcass/door board plus one 6 mm back sheet.

## Practical cabinet starter defaults

- 600 × 720 × 560 mm body initially; user dimensions are preserved by the preset action.
- 18 mm carcass, door and shelf boards; 6 mm back captured in grooves.
- Bottom in 6 mm deep dados, underside raised 30 mm; captured back inset 10 mm.
- 0.2 mm TOTAL groove clearance, subject to an actual test joint and measured stock.
- One adjustable shelf with five Ø5 mm height positions per bank, at 32 mm pitch.
- Two overlay doors, 2 mm reveals/centre gap; selected tested Blum hinge/plate preset, two hinges per door.
- Handle fixing holes only: horizontal 128 mm centres. Match the actual hardware.
- One-side flat machining enabled. Assembly screw holes are optional and off by default; captured joinery requires suitable glue/assembly.

These are a practical starter configuration, not a universal construction standard or load rating. Measure actual thickness; hardware and glue/workholding must suit the job. Edgeband deductions, feet and worktops are not part of this focused style. Body dimensions exclude feet/worktop and the 20 mm door projection. Feeds and RPM are editable examples, not universal cutting recommendations.

## Tool planning

Normally two tools: a **3 mm centre-cutting end mill** for profiles, grooves, Ø5 holes and circular-milled Ø35 hinge cups; a **2.5 mm pilot drill** for the hinge screw holes. Default actual minimum reach is 18.2 mm milling and 10 mm drilling; suggested usable lengths are 22 mm and 20 mm. A 35 mm boring bit is unnecessary because cups are circular-milled.

The summary recalculates with geometry and selected tools. Suggestions choose a small standard cutter that fits non-drilled holes, slots, margins, tabs and sheet spacing; pass depth is reduced if needed to remain valid for a smaller cutter. Feeds/RPM/travel are preserved. Length suggestions describe needed usable cutting/drilling reach, not a guarantee that a suitable tool exists in inventory. Select tools intended for the material and spindle speed. An edge setup changes only its drill diameter/reach when accepting suggestions.

Hardware reference: [Blum catalogue](https://publications.blum.com/2022/catalogue/en/74/). Cutting feeds/RPM depend on tool and material; consult [LMT Onsrud material-specific cutting data](https://onsrud.com/Forms/Cutting-Data-Recommendations.asp). Existing hinge dimensions and presets are retained; the one-side adapter changes machining access, not hardware placement.

## Optional edge pilots

Assembly screw holes pair side clearances with bottom/rail edge pilots, including dado-fixed bottoms. Flat programs exclude edge drilling explicitly. Finish flat machining/cutout and remove tabs before placing the named FINISHED edge up in a secured jig. Edge programs use only an exactly matching pilot drill and never profile. Default edge pilots need 2.5 mm diameter and 20 mm working length.

For one-side projects, Face A in edge instructions is the **Machining face** shown in Parts. G54 X0/Y0 is the lower-left of the exposed edge; Z0 the edge top. Machine X reverses for opposite edges to retain a physically right-handed setup. Each program states its direction. The actual vertical/drop-through fixture, machine height and holder/clamp clearance must accommodate the work. These are not simulated. No edge pilot is included in the flat/sheet pack; it has a separate export and guide.

## CNC conventions and exports

Generic GRBL-compatible / FluidNC: G21, G17, G90, G91.1, G94, G40, G54, explicit G0/G1/G2, no canned cycles/M6/homing/G92. Two semicircles make each circular pass; I/J incremental. Cutter-radius compensation is already in XY. Separate numbered files support manual tool changes and Z re-zeroing. Manual spindle mode requires operator switching; automatic mode emits M3/M5 plus a two-second dwell. Programs end with safe retract, M5 and M2. Existing tool-length offsets are preserved.

G54 lower-left of current blank or sheet, Z0 stock top. Individual blanks have equal margins. Sheets must fit machine travel, with border ≥ cutter diameter and gap ≥ twice diameter. No tiling. Through cuts add spoilboard allowance; blind cuts keep exact depth. Open-ended grooves overrun into waste to clear end corners. Larger holes use concentric clearing and peck drilling handles exactly matching pilots.

Setup ZIP includes NC files, START-HERE guide, REQUIRED-BITS list, face-up orientation JSON, part CSV, editable project and toolpath manifest. Sheet packs add actual layout PDF/DXF, sheet machining CSV and placement JSON. PDFs explicitly state no sheet flip in one-side mode. Original two-face mode retains its own flip instructions. Nothing is sent to a machine.

Validation covers tool/slot/bore fit, reach, depths, blank/sheet travel, safe XY rapids, tabs, finite coordinates and path density. Preview is commanded cutter-centre motion, not stock removal, holder/clamp collision or machine-kinematic simulation. Physically dry-run the actual tools and fixture before cutting. Feed-time estimates exclude rapids, tool changes and setup time.

## Interface, storage and development

IBM Design Language-inspired UI uses self-hosted Plex Sans/Mono, individual Carbon icons, neutral surfaces and blue interaction accents. License notices ship in `dist/assets`. No IBM affiliation or certification claim. Every field has definition/effect/example help. Persistent validation errors retain valid state; fit errors show actual dimensions and a direct field shortcut. SVG assembled preview uses BSP ordering with original-edge strokes, avoiding hidden-panel lines and split seams.

Project format remains `cabinet-workbench`, version 1, autosave key `cabinet-workbench-project-v1`. New settings are additive. Earlier custom dimensions/materials/controller/travel/feeds are retained; absent one-side flag defaults on. Explicit two-face opt-out survives save/load. Autosave is browser/profile/origin-specific; save project JSON for backup. Earlier kitchen autosave is untouched.

```
npm install
npm test
npm run build
```

Static `dist` build. No runtime external dependencies, Three.js, WebGL, CAD worker or OpenCascade WASM. Legacy CAD dependencies remain for regression checks only. Preserve `.openai/hosting.json` identity and the existing private audience.

Validation: 299 automated checks, including raw/canonical immutability, physical cut-volume sampling around redirected bores/dado relief, exact inverse blind/edge geometry, opposed-feature rejection, one-side file coverage/order, canonical sheet placement, tool suggestions/reach/spacing/pass depth, project migration and all prior machining/CAD regressions. Browser QA covers single machining-face door drawings with cups and handles, oversized-tool correction through suggested bits, starter-default dimension preservation, 13 individual and 19 nested A-only programs, setup ZIP and PDF output. The actual downloaded nested pack was independently parsed: valid ZIP CRCs, 50 features, 9 cutouts, 19 A-only files, 776 consistent rounded arcs, 71 safe XY rapids, tool list and 9 face-up orientations. Physical cutting is not verified.

### Workbench 0.11 — production and shared defaults

- Nested sheets now export **one NC file per sheet** in `programs/`. One centre-cutting end mill (separate sheet diameter/reach settings, default 2.5 mm) mills all flat bores, pockets and profiles. Features finish before any profile; four tabs retain each panel. There is one program start/end, no embedded M0/M6, and continuous safe-Z repositioning between panels. One-face sheet orientation is required. Individual blanks retain separate drill/end-mill programs.
- Generic rectangular four-screw, triangular three-screw and single-fixing foot plates support two front or four corner feet, adjustable offsets, pitch, pilot diameter/depth and mounting height. These are **not brand-specific drilling templates**: confirm dimensions against the actual purchased fitting. Two front feet need independent rear support. Foot height means floor to bottom-panel underside; bottom lift is deducted from body clearance above the floor.
- Feet pilots remain blind on the underside, even for dado-fixed bottoms. They appear in Parts → Underside feet and have a separate post-cut fixture setup. Cabinet/sheet packs include these in `secondary-feet/`, clearly separate from the single main program per sheet. Edge pilots continue to use their separate edge-up fixture export.
- Nesting compares 39 deterministic combinations of order and MaxRects scoring. It first minimizes unplaced parts and sheet count, then compact occupied area/offcuts. Material, thickness, allowed rotation/grain, margin and gap remain hard constraints. This is a heuristic search, not a proof of mathematical optimality.
- Saved project defaults control shared handle type/pitch/diameter/setback/reference, installed foot mounting height, back construction/inset/thickness, groove depth/clearance and rail width. Fixed-floor handle alignment accounts for feet and raised bottoms. Inheritance can be disabled per cabinet. This establishes a shared-settings model; multi-cabinet planning is not yet added.
- Sidebar begins under the black header; the clickable assembly stays in its own rail during part inspection, nesting and CAM. Starter preset explanation opens from its info button. Smaller screens use a compact fixed assembly preview.

Validation: automated geometry/CAM, feature coverage, blind foot depths, shared-setting roundtrips and floor alignment, sheet program continuity and nesting non-overlap checks, plus browser QA. Software verification does not replace dry-running and checking the actual machine, cutters, material, workholding and stock zeros.

### Workbench 0.12 — manual tools and finished-edge dimensions

- Top-centre handle position centres each knob/pull pattern on its own door, with the existing top setback or shared floor-height reference.
- Flat tool strategy now supports three physical operation roles: T1 centre-cutting small-hole end mill, T2 dado/groove end mill, T3 contour/hinge-pocket end mill. Small bores larger than T1 are interpolated, not drilled with a twist drill. All bores/grooves/cups finish before any tabbed contour. Separate role IDs allow different cutting tools even if diameters match.
- The selected touchplate workflow keeps one primary NC program per sheet. At a change: retract to configured height, M5, park at probe XY, M0 to change tool/attach plate, G38.2 to find contact, G10 L20 P1 Z<actual plate thickness> to re-establish G54 Z, retract above the plate, then M0 for removal. Automatic spindles restart only after the second pause; manual routers must be switched off/on by the operator. No M6, no homing, and no XY offset reset. The first cutter still needs its initial stock-top work zero. Cutting preview and feed-time estimate exclude probing and tool changes.
- Set the measured plate thickness and physical probing/change parameters. Default 0.5 mm plate, X10/Y10, Z30 change height and 20 mm probe target are examples, not a machine configuration. Validate the real probe circuit, M0/resume, stock contact location, cutter stickout and Z clearance. Program guides link to the [V1 procedure](https://docs.v1e.com/tools/milling-basics/#tool-change); standard probing and work-offset commands are described in the [GRBL command reference](https://github.com/gnea/grbl/blob/master/doc/markdown/commands.md).
- Standalone T1/T2/T3 files are also supplied in `manual-stage-alternatives/`, and can be selected as the primary export instead. Run either the combined program or its alternatives, never both. Stage files require a manual stop/change/G54 Z re-zero between files while keeping XY and stock fixed.
- Through feet holes are now the default and stay in the single-face flat program. Blind underside pilots remain an explicit alternative with the prior separate setup.
- Edgeband thickness defaults to 0 for compatibility. Selected edges: all four door edges and exposed fronts of sides, bottom, front rail and shelves. CNC core sizes deduct one thickness per edge; the finished assembled model keeps its planned sizes. Hardware centres remain referenced to finished edges, and open-ended pockets are clipped to the core. Back, rear rail and hidden joining edges are not banded. Door/front groups can be disabled independently; these settings are also project defaults.
- Parts highlight banded edges and show core versus finished dimensions. Nesting, profiles, DXF and NC use core sizes. CSV and the PDF edgeband schedule record core/finished sizes and banded edges. Band schedules use each panel’s machining-face coordinates before nesting rotation.
- Starter explanation is placed beside the Starter Preset caption, above the action button.

Checks include geometry/finished hardware alignment, through/blind foot setup coverage, per-role cutter reach, complete operation coverage with contours last, program termination/continuity and M0/probing/spindle command order. Machine execution has not been physically tested by the app.

### Workbench 0.13 — shared hardware and orientation correction

- Project defaults now group Handles, Feet, Hinges, Back & rails, and Edgebanding. Feet include fixing type, count/layout, through/blind selection, height, offsets, pattern pitch, diameter and blind depth. Hinges include preset, compatible plate, count, end setback and single-door handing. Inherited local edits update shared values; independent cabinets retain their overrides. Switching hinge presets resets the shared/local plate to the compatible 0 mm option.
- Fixed an edgeband orientation error in v0.12. The planner reverses local depth when placing a cabinet, so the front is not always the minimum flat-panel coordinate. The front edge is now derived from the cabinet frame, projected onto panel coordinates and mirrored together with single-face geometry. Front banding is opposite the captured-back groove, including rotated cabinets. Drawings label FRONT/BACK. CNC core origins, hole coordinates, pocket clipping, nested operations and exported band schedules all use the corrected edge. **Regenerate banded layouts and toolpaths exported with v0.12.** Finished panel dimensions are unchanged.
- Renamed the compact cabinet input to Stock thickness. Native selects and accordion headers use consistent 16 px chevrons with clear spacing and reserved text area.
- Workflow navigation uses four contained tabs with primary and secondary labels, equal-width columns, horizontal scrolling when needed, visible focus, selected state, and Left/Right/Home/End keyboard navigation. Number badges are 22 × 22 px with 10 px numerals at every breakpoint. The persistent assembly remains available. Reference: [Carbon tabs guidance](https://www.carbondesignsystem.com/building-blocks/core/components/tabs/guidelines#secondary-labels).

Regression coverage includes the reported 400 mm cabinet / 3 mm front band / captured-back case, all four cabinet rotations, mirrored side faces, nested operation coordinates, hardware inheritance, compatible-plate validation and migration from earlier projects. Browser QA checks actual badge dimensions, single-line stock label, tab focus/navigation and shared hardware controls.


### Workbench 0.14 — direct feature editing and drawing clarity

- The Parts drawing supports keyboard and pointer selection of holes, grooves and all four panel edges. Its property dialog edits one feature or all current similar features, with Restore defaults and Undo. Hole edits include diameter, depth/through and displayed centre coordinates; applying position changes to similar holes preserves their relative spacing. Groove edits change machining clearance/depth while Construction controls mating panel dimensions. Edge band thickness can be added, changed or removed independently; finished panel dimensions stay fixed.
- Feature overrides are saved with the project and flow through core dimensions, one-face transforms, nesting, PDF/DXF layouts and NC. Invalid geometry is rejected before saving. Similar applies to current matches in this cabinet, not future kitchen-wide defaults. Hardware patterns are not repositioned automatically by an individual-hole edit.
- Assembly outlines are drawn after panel fills, clipped against nearer faces. Visible bottom/back seams and coplanar joining edges remain outlined without showing hidden edges through solid panels.
- Part captions, dimensions, orientation and legends use fixed-size HTML typography instead of scaling SVG text. Tabs have white backgrounds, grey dividers and Carbon icons. The global hover-tip instruction is removed and the starter Information icon matches the neutral information style.

Validation: 340 automated tests, including edited hardware/bands, mirrored coordinates, matching-feature movement, save/load, validation rollback, one-face setup and nested NC coverage. Browser checks cover direct SVG selection, all-similar changes, Undo, invalid-position feedback, band deductions, groove edits and sheet pack export. Machine execution has not been physically tested.

### Workbench 0.15 — hinge presets in context and captured-joint outlines

- Selecting any hinge cup, fixing or mounting-plate hole now opens a Hinge hardware dialog with the existing Blum/Häfele preset and compatible mounting plate dropdowns. Apply regenerates the complete matching cabinet pattern, updates inherited shared defaults and supports Undo. Changing preset/plate clears stale individual hinge-hole overrides while retaining unrelated edits. An independent cabinet keeps its project defaults unchanged.
- Fixed the remaining back/bottom preview problem at captured joints: original panel perimeter edges lie inside adjoining stock, so perimeter-only outlines cannot show the actual junction. The preview now computes finite intersections of visible panel surfaces and clips those junction lines against nearer faces. Selected panels highlight their junctions too. Exploded panels retain separate outlines; closed doors hide the covered junctions.
- Replaced the orientation sentence with a fixed-size FRONT marker beside the corresponding drawing edge, including mirrored Face B views. Captions remain outside the scaled geometry. Starter settings now use a compact tile with a short description, neutral info control and quiet Use preset action.

Validation: 344 automated tests, including actual 400/600/900 mm captured cabinet seams, exploded/closed occlusion, matched hinge regeneration, stale override cleanup, shared/independent settings and project roundtrip. Browser checks cover hinge dropdown/plate options, Häfele/Blum cup-depth changes, Undo, drawing marker placement and the starter tile.

### Workbench 0.16 — base and wall cabinet styles

- Cabinet style selects Base or Wall. Base keeps two support rails; Wall creates a full top, starts at 320 mm deep with two adjustable shelves, lower handles and a 6 mm bottom-dado lift. Width, height, name and shared hardware/material assignments are retained when switching. Depth, shelf/lift defaults and individual feature overrides are replaced; Undo restores the exact previous cabinet. New cabinet and Use preset follow the current style. Existing projects without a style load as Base.
- Wall panels use the complete existing manufacturing pipeline: captured-back grooves in sides/bottom/top, optional bottom dados and assembly holes/edge pilots, one or two doors, matched hinge presets, shelf-pin banks, handles, drawing feature editing, stock grouping, nesting, PDF/DXF and one primary NC program per sheet. The full top is included in front banding and matching edge edits; its underside groove face is reoriented for one-face machining.
- Shared hardware, back and bands apply to wall cabinets. Saved base feet never generate wall foot holes; wall UI omits feet setups. Wall handle placement/reference/height are local, while common handle type/pitch/diameter/setback remain shared. Base handle placement and feet settings are preserved. Wall body-bottom height (default 1500 mm) supplies the floor reference for fixed-height handles, without shifting stock/CNC coordinates.
- Wall suspension hardware, wall fixing design and hanger drilling are not included. The interface and help state this limitation; no generic hanger holes are inferred.

Validation: 351 automated tests covering legacy base migration, full-top/back geometry, shelf and handle drilling, shared-feet exclusion, independent wall handle placement, installation height, banding/mirrored top face, style changes, save/load and full sheet NC/PDF/DXF coverage. Browser QA checks style selection and Undo, top inspection, hidden wall feet setup, and an actual downloaded 600 mm wall pack with nine panels and three primary NC programs for three sheets. Software checks do not constitute a physical machine or installation test.

### Workbench 0.17 — kitchen height targets, open fronts and travel sequencing

- Primary kitchen height targets are saved as `installation` on the cabinet and shared project defaults: finished counter height, worktop thickness, wall gap and wall top height. Base body height = counter − worktop − feet mounting height + bottom lift when dado-fixed. Feet height is floor-to-bottom-panel underside and remains a physical allowance even with foot drilling off. Wall bottom = counter + gap; body height = shared wall-top target − bottom. A future tall style can use that same top target. Existing projects gain targets preserving their previous carcass dimensions. Invalid heights reject the edit and retain the last valid design. Worktops and bought feet remain allowances rather than extra CNC panels.
- Both styles offer open/no doors, one door or two doors and independently select rails or a full top. The selected construction flows through grooves, holes, banding, clickable Parts, nesting and all exports. Wall handles now offer only bottom free-edge or bottom-centre; legacy top/floor wall preferences normalize to bottom placement. Base handle options remain available. No door means no hinge/handle drilling.
- Cabinet view is split into a scrollable stack of settings, height controls and part statistics on the left and a full-height selectable assembly on the right. Drawing controls overlay the image. Other workflow tabs retain their persistent assembly rail.
- Flat CAM sequences complete operation blocks with a deterministic nearest-next/local-swap heuristic, retaining the better original route. Global stage routing crosses part boundaries on sheets, removes redundant between-part origin returns, and orders profiles separately after all features. Tool/probing and face/setup barriers are preserved; cutting direction, pass geometry, safe-Z XY travel and tabs remain intact. Single-cutter sheets, manual tool stages and individual blanks use the route planner. Existing edge-fixture drilling is unchanged. Rapid/feed statistics are recalculated from the actual joined moves. This is not a proof of globally minimal travel.

Validation: 359 automated tests covering all base/wall × top × front combinations, height compensation, migration/roundtrip, shared top/gap logic, bottom-only wall hardware, deterministic travel improvement, cut-path/block preservation, safe moves, feature coverage and profile-last sheet programs. Browser checks verify the 900/38/150/30 → 742 mm base and 100 mm feet → 792 mm body, wall 900+550 bottom / 2200 top → 750 mm body, invalid-height rollback, open fronts, both top constructions, larger clickable preview and a downloaded three-sheet pack. Actual machine execution is not physically tested.


### Workbench 0.18 — handles, inset doors and glass frames

- Selecting a handle hole opens matched handle style, placement, pitch, diameter and edge setback controls, with the shared-default behavior shown explicitly. Wall placements remain bottom-only. **Edit this hole only** retains precise individual editing. Handle preset changes clear stale individual handle-hole overrides, preserve unrelated features and support Undo.
- Settings panels are 20% wider on desktop (300 → 360 px; wide 320 → 384 px; compact 270 → 324 px). Toolpaths uses a machining-setup dropdown, grouped machine/travel/tool settings, collapsed required-bit and setup instructions, and a persistent export action row. The assembly stays visible.
- **Inset · Blum 71B3750** creates doors inside the carcass opening, with 2 mm side/top/bottom/centre reveals. Bottom reveal follows the top of the raised bottom; shelves have 4 mm clearance behind the 18 mm door. The matching 0 mm plate uses a 56.5 mm fixing line (37 + 18 + 1.5) from carcass front. Cup Ø35, 13 mm depth, 45 mm fixings, 9.5 mm eccentricity and 5 mm cup-edge distance. Overlay presets retain their geometry. Manufacturer reference: https://publications.blum.com/2026/catalogue/en/71/ and https://publications.blum.com/2026/catalogue/en/70/ . Check purchased hardware and trial-fit before production.
- **Glass in wooden frame** routes a one-piece frame from an 18 mm wooden blank, with an adjustable 50–150 mm frame and 3–6 mm bought glass. An 8 mm inside rebate is glass thickness + 2 mm deep. Glass cut sizes include 8 mm overlap and 2 mm total fitting clearance; confirm the actual routed fit before ordering. Retainers are fitted separately, with no generic retainer drilling. Glass itself is excluded from wood nesting and CNC drilling; `glass-cut-list.csv` and frame instructions ship in the setup pack.
- Four overlapping rebate strips avoid bulk-clearing the window. An inward-compensated interior contour cuts the opening, with through allowance and four waste-retaining tabs. Rebate tools are limited to Ø6 mm for corner clearance. Manual tools use T2 for rebates and T3 for the opening/cups, then exterior cutouts. All geometry stays on the hinge/inside face. Remove aperture waste and tabs before fitting glass. This is a routed one-piece frame, not a rail-and-stile joint system.

Validation includes prior regressions plus inset fit/plate coordinates, matched handle regeneration and wall-local inheritance, glass migration, one-face/nested operation coverage, interior cutter compensation/depth/tabs, frame/hardware collisions and exterior profiles last. Physical machining and glass installation remain untested.


### Workbench 0.19 — multiple cabinets and layout restoration

Projects now keep up to 100 independent base/wall cabinets. The Active cabinet selector switches the editable cabinet; Add, Duplicate and Remove support Undo. Save/Open project and autosave retain the complete collection and active selection; earlier single-cabinet files migrate automatically. Project defaults update inheriting cabinets while independent exceptions remain local. Any invalid shared change rejects the edit for the whole project.

Nesting combines all project cabinets by material and thickness, with cabinet-qualified part IDs. Clicking a nested part opens its owning cabinet. Nested sheet programs and packs include all cabinets, while individual blank, edge and underside setups use the active cabinet. Parts and glass CSVs identify the owning cabinet; the project JSON in each pack contains the full collection. This iteration is a cabinet collection with joint production, not a room-placement planner.

The sidebar and Toolpaths layout return to the pre-0.18 arrangement. All workflow tabs occupy the same width; the persistent assembly starts beneath the tab bar. Wall starter defaults use one plain grey button with hover/focus help. The assembled bottom preview clips hidden dado tongues at the side-panel interior faces; exploded and manufacturing dimensions keep the full joinery.


### Workbench 0.20 — front elevation, tall cabinets and corrective actions

- Cabinet selection uses a compact label/action row, with Carbon add/copy/delete icons, accessible names and tooltips. The footer and its text are removed; the existing Save action retains a status tooltip.
- Cube and front-elevation icons switch the Cabinet drawing between the selected assembly and the project front. Base/tall units automatically form the lower row and wall units form the upper row. Automatic walls skip tall units; explicit **Position from left** values permit gaps and alignment. Cabinet widths and the total run extent (including gaps) are dimensioned. Click any front to select it. Positions survive save/load and project-pack export. A front overlap shows buttons to move either affected cabinet. This is a front arrangement, not a room/corner planner or a collision check in depth.
- **Tall** starts at 560 mm depth, full top, four shelves, one door and four hinges. Its body height compensates foot height and the raised bottom, with its top driven by the same **Top above floor** target as wall cabinets. Tall handle placement and hinge count stay local; other shared hardware/construction defaults still apply. Feet, joinery, banding, nesting and sheet CNC use the existing production pipeline. Default 1200 mm stock and 1500 mm machine travel do not fit full tall sides: choose physically adequate stock/machine travel before exporting. There is no automatic tiling.
- Configuration errors retain the last valid whole project, identify the affected cabinet, and offer buttons for relevant fields. Buttons navigate to the right tab/cabinet, open its settings section and focus the input. Tool fit/reach errors link to their tool role, and unplaced stock errors link to stock/travel settings. Front-position overlaps are shown in the drawing with move actions.

Validation covers tall height/feet/top alignment and local hardware, adequate-stock CNC and small-stock rejection, automatic/manual front positions, overlap detection, project persistence and relevant diagnostic actions, plus all prior regressions. Physical machining/installation remains untested.


### Workbench 0.21 — wooden drawers on Blum TANDEM

Cabinet Front type now selects doors, TANDEM drawers or an open front. TANDEM supports one to four overlay slab fronts, numbered from the top. Earlier front heights are editable (0 = equal share); the last takes the remaining height. Reveals/gaps stay 2 mm. Drawer boxes replace shelves and hinge drilling. Independent drawer side stock selects European 560H (11–16 mm, internal width LW−42) or 560F (17–19 mm, LW−49), both full-extension BLUMOTION with T51.1700.04 locking devices. Supported common nominal lengths are 250/270/300/350/400/450/500/550/600 mm. Automatic picks the longest fitting the usable captured-back depth with 3 mm clearance; box length is NL−10. Inset drawer fronts, inner drawers, TIP-ON, side stabilisers and US 563-series patterns are not implemented.

Each drawer creates two sides, internal front, rear, floor and decorative front. Box height fits automatically below its front/top closure, capped by an editable maximum. Floor thickness is 6–12 mm; its underside is recessed 13 mm into 4 mm deep side/front grooves, with the shared fit clearance. The rear rests on the extended floor rather than receiving a bottom groove. Assembly must secure it to the sides/floor. The runner envelope uses the Blum planning section (floor underside 27.5 mm above baseline; fixing row 37 mm above baseline), maintaining at least 7 mm upper clearance. Runner pilots use length-specific fixing-chart positions, Ø2.5 ×10 mm for Ø4 ×15 screws; cabinet stock must be at least 16 mm. Front screw pilots/clearances and handle through bores are generated. Drawer front bands deduct from all four edges; box walls do not inherit carcass-front bands.

All generated flat features are included in the existing single-face adapter, material/thickness nesting, PDFs/DXF and NC. Drawer handle placement is local; common type/pitch/setback remain inherited. Hardware CSV and TANDEM secondary-preparation instructions are downloadable and included in setup packs (whole project for nested sheets, active cabinet otherwise). REQUIRED secondary manual/jig work: rear runner clearances, rear-hook Ø6 ×10 bores and fitting the locking devices using the matched Blum T65.1000.02 template. These are explicitly omitted from flat NC and identified in the UI/guide; do not skip them or infer generic holes. The rear profile/hook fit needs a physical trial assembly. The 30 kg figure is the hardware rating, not a certification of the wooden box/floor.

Primary references: https://publications.blum.com/2026/catalogue/en/446/ ; /447/ ; /454/ ; /455/ ; /476/ ; /477/ and Blum TANDEM 19 mm planning brochure (560F BLUMOTION pp20–21, fixing chart p37). Never interchange BLUMOTION, TIP-ON, locking-device and hook/peg variants.

Validation: 385 automated checks pass, including stock/runner compatibility, top-down/remainder fronts, all cabinet styles × drawer counts, physical floor/groove/back geometry, fixing patterns, complete program operation coverage, one-side orientation, band deductions, multi-cabinet persistence and shared/local handle behavior. Machine execution and hardware trial assembly remain unverified.


### Workbench 0.22 — independent cabinets, drawer setup and documents

Project Defaults controls are removed. On opening the app, effective legacy cabinet values are retained, then every cabinet becomes independent. Editing handle/back/foot/height values affects only the active cabinet. The saved independentCabinets flag prevents shared defaults from being reapplied on reopen; legacy metadata remains for older file compatibility.

Drawer-related field edits reconcile dependent values before validation: a newly selected 560H/560F family selects compatible drawer stock, changes to stock correct incompatible family selections, runners that no longer fit switch to automatic length, usable drawer quantity/front heights are balanced, and handle patterns/setbacks are fitted around the actual box geometry. Automatic changes are described in the drawer section. Carcass dimensions and physical limits are not silently enlarged. Only drawer-specific overrides are cleared by drawer construction changes; unrelated carcass edits survive. The Equal front heights control is icon-only with an accessible name/tooltip.

Documents is a fifth workflow tab with Downloads and Cost estimate subviews. Standalone project JSON, cut/hardware/glass CSV, layout PDF/DXF, sheet-machining CSV, face-up JSON, required-bit list, TANDEM preparation guide and estimate CSV are collected here; Download all documents creates a ZIP without NC files. Toolpath programs/setup packs remain in Toolpaths. Unplaced parts disable layout exports and are listed in the bundle; other documents remain available.

Costs use user-entered prices in one chosen currency. Materials default to whole nested-sheet quantities by material/thickness (including nesting waste); optional net-part-area pricing uses m² and explicitly excludes waste. Hardware counts include runner/locking-device pairs, runner screws, hinges/plates, handles and feet. Glass is m² and banding is linear metres. Additional items accommodate consumables, labour, delivery or worktops not otherwise included. Empty prices remain unpriced and the UI shows a partial subtotal; zero is an explicit entered price. No currency conversion, tax, markup, market pricing or complete-installation quote is inferred. Price keys include material, thickness and pricing basis; changing basis preserves hardware prices and keeps separate material prices. Prices/currency/extras survive autosave and project files; changing only costs does not discard generated toolpaths. CSV amounts round each line to currency cents.

Nesting and Toolpaths have accessible icon-only Previous/Next controls beside their dropdowns, disabled at the ends. Toolpath scrubbing has a blue progress track, visible thumb, keyboard-supported move count, and first/all-moves icon controls. Workflow tab width remains stable with five tabs and horizontal overflow on smaller screens.

Validation: 392 automated checks pass, including 81 ordinary drawer handle/size/count/placement combinations, automatic stock/family/length/front reconciliation, independent-cabinet migration/roundtrip, sheet/area cost quantities and stable price keys, hardware pairs, zero/missing prices, extras persistence, invalid price rejection and partial estimates for unplaced stock. Browser checks cover arithmetic totals, document ZIP without NC, saved cost metadata, navigation endpoints, keyboard scrubbing and retention of generated programs after price edits. Physical machining/hardware assembly remains untested.

### 0.22.1 — Shared back and drawer-bottom stock

Nesting → **Drawer bottoms use back material** is on by default, including projects saved before this option existed. Matching back/bottom thicknesses can now share sheets; disable it when bottoms use the carcass material instead. Different thicknesses always remain separate. The setting saves with the project and applies consistently to layouts, sheet toolpaths and material estimates.

### 0.22.2 — Mobile settings visibility

Phone layouts use the page's normal vertical scroll for the settings panel. Front type, TANDEM drawer controls and lower nesting material options no longer sit inside a separate 440 px scrolling region that can make them appear missing.

### 0.23 — Panels follow the workflow

Documents & costs now has a wider kitchen elevation and cabinet price breakdown. Shared sheet costs (including waste) are allocated by each cabinet's area within the material/thickness group; hardware, glass and banding follow quantities. Rounded cabinet lines reconcile to the project estimate. Additional items remain project-wide, and missing prices or unplaced parts are marked as partial.

Selecting a nested part stays on Nesting, selects its owning cabinet and highlights that panel in the assembly; Inspect selected part opens machining details. Toolpaths replaces the assembly rail with an always-open Required bits panel for the selected setup, including separate blind-feet preparation. The app also has a local SVG favicon. On narrow screens, costs and bits use normal page flow instead of a floating overlay.
