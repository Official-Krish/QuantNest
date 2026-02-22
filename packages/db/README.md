# QuantNest DB Package (`packages/db`)

Shared MongoDB models and DB client exports used by backend and executor services.

## Responsibilities
- Define schema/model contracts for users, workflows, executions, and related records
- Provide reusable model exports to app services

## Usage
Imported as workspace package:
- `@quantnest-trading/db/client`

## Key File
- `index.ts` - model definitions and exports

## Notes
- Uses Mongoose.
- Connection lifecycle is handled by app services (`apps/backend`, `apps/executor`), not this package.

See root README for full platform context: `../../README.md`.
