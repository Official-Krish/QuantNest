# QuantNest Frontend (`apps/frontend`)

The frontend is the user-facing React/Vite application for building and monitoring QuantNest workflows.

## Responsibilities
- Authentication UX (signup/signin)
- Visual workflow builder (trigger/action graph)
- Workflow CRUD interactions with backend APIs
- Executions dashboard and run history
- Profile and token-management UX flows

## Stack
- React 19
- Vite
- Tailwind CSS
- React Router
- React Flow (`@xyflow/react`)

## Scripts
```bash
bun run dev
bun run build
bun run lint
bun run preview
```

## Environment Variables
Create `apps/frontend/.env.local`:

```env
VITE_BACKEND_URL=http://localhost:3000/api/v1
```

## Run Locally
```bash
cd apps/frontend
bun run dev
```

## Notable Folders
- `src/components/workflow/` - workflow canvas, trigger/action sheets
- `src/components/nodes/` - node renderers
- `src/http.ts` - API client layer
- `src/types/` - frontend API response typings

## Notes
- This app expects backend to expose APIs under `/api/v1/*`.
- Market status is fetched from backend `/market-status` endpoint.
- Auth uses HttpOnly JWT cookies (`withCredentials: true`) plus a local non-sensitive UI session flag.

For platform-wide architecture and setup, see root README: `../../README.md`.
