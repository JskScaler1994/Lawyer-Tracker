# Court case tracking app

_Started 2026-09-06 15:29 UTC_

---

## User

Let's create a mock up for a court case tracking application. The primary device will be IPad. The first page should ask for case number, case status, Last hearing date, next hearing date.

## Assistant



## Assistant

I'll explore the design system first.

_[tool: list_files]_

_[tool: read_file]_

_[tool: grep]_

_[tool: grep]_

_[tool: list_files]_

_[tool: read_file]_

_[tool: ask_user]_

Form's up — mainly need to know whether that first page is search or case entry, plus who's using it and which screens to include.

## User

Answered — page_purpose: New case entry — add a case to the tracker; audience: Advocate / lawyer tracking their own matters; orientation: Both; scope: Entry/search page (required), Case detail with hearing history, Calendar of upcoming hearings; statuses: anything; extra_fields: No; jurisdiction: India (district/high court, CNR numbers); variations: Yes — two layouts for the entry page

## Assistant

_[tool: dc_write]_

_[tool: dc_write]_

_[tool: dc_write]_

_[tool: ready_for_verification]_

Four iPad screens on the design system's paper/ink palette, in a pan-and-zoom canvas:

- **1a** New case, landscape — form plus a live record preview and recent entries
- **1b** New case, portrait — single column, quick-set next-hearing chips
- **1c** Case detail with hearing history timeline
- **1d** September calendar with a next-seven-days rail

Sample data follows Delhi district/high court conventions (CNR, O.S./Crl.M.C./W.P.(C)); statuses are Pending / Adjourned / Reserved for orders / Disposed. Tell me which entry layout you prefer and I'll build the rest around it.

## User

Found issues — fixing…

## Assistant

_[tool: run_script]_

_[tool: ready_for_verification]_

Darkened all meta/label text to #6A6154 (4.5:1+) and tightened the calendar day chips to a single ellipsized line.

## User

CAse status should be a text box.

In the new case page, we need two fields, court establishment and place

## Assistant

_[tool: dc_html_str_replace]_

_[tool: dc_html_str_replace]_

_[tool: run_script]_

_[tool: ready_for_verification]_

Case status is now a text field in both entry layouts, and Court establishment + Place sit as a paired row under it; form spacing tightened so everything still fits the iPad frame.

## User

Found issues — fixing…

## Assistant

_[tool: dc_html_str_replace]_

_[tool: dc_js_str_replace]_

_[tool: ready_for_verification]_

Calendar chips now stack case number over time on two lines instead of truncating.

## User

Found issues — fixing…

## Assistant

_[tool: run_script]_

_[tool: ready_for_verification]_

Widened the chip area (less cell padding), dropped labels to 11px with word-break, and shortened the two long case tokens.

## User

Found issues — fixing…

## Assistant

Copy edit only — root cause is stale text, not layout.

_[tool: dc_html_str_replace]_

_[tool: ready_for_verification]_

Updated the 1b subhead to match the six fields.

