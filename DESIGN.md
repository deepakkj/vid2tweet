# Vid2Tweet Design System

Vid2Tweet uses a lightweight product UI designed around a simple operating loop: submit, monitor, review, approve.

## Product Principles

- **Operational clarity first** — the current pipeline state should always be obvious
- **Low-friction review** — generated tweet text and thumbnail should be visible with minimal navigation
- **Safe publishing** — dry run and explicit approval are first-class controls
- **Utility over decoration** — the UI should feel like a creator tool, not a marketing site

## Current Surface Areas

### Home Screen

- URL input
- YouTube cookies accordion
- Dry-run checkbox
- Connect X banner with connect/disconnect state
- Recent pipeline list with live status badges

### Pipeline Screen

- Execution state header
- Step-by-step progress list
- Thumbnail preview loaded from Kestra artifact storage
- Approval panel with editable tweet textarea
- Approve and reject actions wired to Kestra resume

## Visual Tokens

### Palette

- `--color-bg`: `#F8F7F3`
- `--color-surface`: `#FFFFFF`
- `--color-text`: `#1F2937`
- `--color-muted`: `#6B7280`
- `--color-primary`: `#2563EB`
- `--color-primary-hover`: `#1D4ED8`
- `--color-success`: `#16A34A`
- `--color-warning`: `#D97706`
- `--color-error`: `#DC2626`

### Typography

- Font stack: Inter, system-ui, sans-serif
- Headings: strong weight and tight tracking for dashboard clarity
- Body copy: medium contrast, compact spacing
- Status text: semibold with badge treatment

### Spacing

- Base unit: `4px`
- Primary working scale: `8, 12, 16, 24, 32, 48`

### Shape

- Cards: `12px`–`16px` radius
- Buttons / inputs: `8px`–`10px` radius
- Badges: full or near-full pill radius

## Component Behavior

### Cards

- White background
- Soft border
- Minimal shadow
- Generous padding for scanning status blocks

### Inputs

- Neutral border at rest
- Blue focus ring
- Monospace treatment for cookie text input

### Buttons

- Blue for primary actions
- Green for approval
- Red for reject/destructive actions
- Disabled states should clearly signal blocked actions, especially when tweet length exceeds the limit

### Status Badges

- `RUNNING` → blue
- `PAUSED` → amber
- `SUCCESS` → green
- `FAILED` → red

## UX Notes Tied To Implementation

- The approval textarea mirrors the final payload sent to Kestra on resume
- Character count is visible because the flow revalidates tweet length after manual edits
- The connected X account is surfaced in the home banner because the posting path changes when an OAuth 2.0 token exists
- Recent executions are visible on the home page because polling and execution recovery are part of the normal workflow
