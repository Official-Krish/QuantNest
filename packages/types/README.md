# QuantNest Types Package (`packages/types`)

Shared TypeScript contracts and request schemas used across frontend, backend, and executor.

## Responsibilities
- Domain types for nodes, edges, metadata, execution steps
- Indicator expression model types
- Zod request validation schemas for backend metadata routes

## Exports
- `@quantnest-trading/types`
- `@quantnest-trading/types/metadata`
- `@quantnest-trading/types/indicators`

## Key Files
- `index.ts` - core shared platform types
- `indicators.ts` - indicator expression schema/types
- `backend.ts` - Zod schemas for workflow/auth payload validation

## Notes
- Keep cross-service contracts here to avoid drift.

See root README for architecture and service wiring: `../../README.md`.
