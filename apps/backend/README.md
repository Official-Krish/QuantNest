# QuantNest Backend (`apps/backend`)

Backend service for auth, workflow management, execution history retrieval, and token lifecycle endpoints.

## Responsibilities
- User authentication and profile APIs
- Workflow CRUD APIs
- Execution history read APIs
- Zerodha token create/update/status/delete APIs
- Market status endpoint proxy

## Runtime
- Express 5
- Mongoose
- JWT auth middleware

## Scripts
```bash
bun run index.ts
```

## Environment Variables
Create `apps/backend/.env`:

```env
MONGO_URL=mongodb://localhost:27017/myapp
JWT_SECRET=replace_with_secure_secret
NODE_ENV=development
```

## Run Locally
```bash
cd apps/backend
bun run index.ts
```

Default port in code: `3000`.

## API Groups
- `/api/v1/user`
- `/api/v1/workflow`
- `/api/v1/zerodha-token`
- `/market-status`

## Key Files
- `index.ts` - app bootstrap + route registration
- `routes/user.ts` - signup/signin/profile/verify
- `routes/workflow.ts` - workflow + executions routes
- `routes/token.ts` - Zerodha token routes
- `middleware.ts` - JWT verification middleware

For complete platform context, see root README: `../../README.md`.
