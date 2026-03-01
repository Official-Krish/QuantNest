# QuantNest Executor (`apps/executor`)

Executor is the worker service that continuously polls workflows, evaluates triggers, executes actions, and records execution logs.

## Responsibilities
- Poll workflows from MongoDB
- Evaluate trigger conditions (`timer`, `price-trigger`, `conditional-trigger`)
- Route branch logic (`true` / `false`) for conditional nodes
- Execute broker actions (Zerodha, Groww, Lighter)
- Send Gmail/Discord notifications
- Enrich notifications with AI reasoning (Gemini)

## Runtime
- Bun + TypeScript
- Mongoose
- Resend (email)
- Gemini (`@google/genai`)

## Scripts
```bash
bun run index.ts
```

## Environment Variables
Create `apps/executor/.env`:

```env
MONGO_URL=mongodb://localhost:27017/myapp
RESEND_API_KEY=your_resend_key
GOOGLE_API_KEY=your_gemini_key
```

## Run Locally
```bash
cd apps/executor
bun run index.ts
```

## Polling Behavior
- Poll interval and cooldown are defined in `config/constants.ts`.
- Main loop lives in `jobs/workflow.poller.ts`.

## Key Files
- `index.ts` - worker bootstrap
- `jobs/workflow.poller.ts` - poll loop and trigger dispatch
- `execute.ts` - recursive workflow execution engine
- `services/indicator.engine.ts` - indicator caching/evaluation/snapshots
- `ai-models/index.ts` - AI provider entrypoint (Gemini today, extensible for future models)
- `executors/` - broker and notification adapters

For full architecture and operational guidance, see root README: `../../README.md`.
