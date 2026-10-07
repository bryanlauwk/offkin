# Follow-up: public hero and text boundaries

## Reproduced public defects

The published main `e4d42c97921e8c81ceb7e1f723fcd1f2e51a9281` (tree `7c028010737a4ec125b008f00be0f7b28612bdb0`) was inspected through actual desktop screenshots on 2026-10-07.

At a 1179px viewport / 1164px client width, the opening container was approximately x32.4 / width1099. The left introduction was width516.6 and entry width500. The absolutely positioned illustration started around x471.5 with width692.5, covering the right side of the description and entry form. Its `top:-59px` also overlapped the saved-resume banner. The full-page screenshot additionally showed application numerals splitting into separate digits. A restored-result screenshot showed the CJK brand name ending with one character isolated on a second line.

## Small scoped repair

- Place the whole hero illustration in the normal-flow right grid column, spanning the introduction and entry rows. Use a real 20–36px column gap and 48/52 columns; cap the illustration at its own column width
- Remove the negative top/right offsets and the oversized 1010px wide-screen override. Do not mask or crop the illustration
- Keep the existing stacked mobile flow through 800px, including its intended full-width artwork and positive vertical margins
- Reserve an unbroken, nonshrinking two-character space for application labels; allow adjacent card text to shrink normally
- Use `word-break:keep-all` for the result brand heading and retain `overflow-wrap:anywhere` for genuinely oversized names

Only layout CSS and regression tests change. All artwork, runtime handlers, exact headline, generation hold, backend/ProductPlan/auth/privacy/source lineage and sharing contracts remain unchanged. No provider call, merge, deployment or public publication was performed.

## Verification

Fresh final-source checks on 2026-10-07:

- Full suite: PASS, 1,009 tests across 33 files
- Focused layout / Studio / Board / Marketing / session suite: PASS, 101 tests across 5 files
- App and Node TypeScript configurations: PASS
- Full ESLint: PASS, zero errors and 8 existing shared-UI react-refresh warnings
- Production build: PASS, existing large-chunk warning remains
- Mocked legacy generation contract: PASS, zero provider calls
- Diff whitespace check: PASS
- Independent source review: no blockers; 76 focused tests, app TypeScript and focused lint passed independently

 The stylesheet tests cover desktop widths801,960,1024,1164,1179,1440,1700,1920,2560 and stacked widths320,390,485,640,800. They check the applicable CSS declarations, column/row allocation, bounded width, automatic offsets, mobile stacking and numeral/CJK rules. A component regression confirms saved-resume UI sits outside the grid and the headline, form and artwork remain separate grid children.

These are structural and stylesheet-contract tests, not browser geometry or paint measurements. The patched page still needs actual desktop/mobile acceptance after an authorized preview/publication. Local Chromium socket access and cloud-browser local URLs remained restricted; no bypass or substitute rendering claim was made. Retest the saved-resume banner, long introductory copy, active conversation, application labels and restored CJK/oversized brand names.
