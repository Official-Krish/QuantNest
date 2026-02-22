# QuantNest Executor Utils (`packages/executor-utils`)

Shared runtime helpers used by backend and executor for operational concerns.

## Responsibilities
- Market open/close status helpers
- Zerodha token status and persistence helper surface
- Shared utility functions used across app services

## Usage
Imported as workspace package:
- `@quantnest-trading/executor-utils`

## Key File
- `index.ts` - exported utility functions

## Notes
- This package is intentionally runtime-focused and app-agnostic.

See root README for full operational flow: `../../README.md`.
