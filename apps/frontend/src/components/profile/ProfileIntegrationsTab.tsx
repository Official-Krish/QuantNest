import { Button } from "@/components/ui/button";
import type { IntegrationItem } from "./types";

type ProfileIntegrationsTabProps = {
  integrations: IntegrationItem[];
};

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function ProfileIntegrationsTab({
  integrations,
}: ProfileIntegrationsTabProps) {
  return (
    <div className="space-y-6">
      <div>
        <div className="text-lg font-semibold text-neutral-100">Connected Services</div>
        <p className="mt-1 text-sm text-neutral-400">
          These are workflow-scoped integrations. One user can reuse multiple accounts or destinations across different workflows.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {integrations.map((integration) => (
          <div key={integration.key} className="rounded-3xl border border-neutral-800 bg-black/40 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-sm font-semibold text-neutral-100">{integration.name}</div>
                <div className="mt-1 text-sm leading-6 text-neutral-400">{integration.description}</div>
              </div>
              <span
                className={cx(
                  "rounded-full px-2.5 py-1 text-[11px]",
                  integration.status === "connected"
                    ? "bg-emerald-500/12 text-emerald-400"
                    : "bg-neutral-800 text-neutral-400",
                )}
              >
                {integration.status === "connected" ? "Active in workflows" : "Not linked yet"}
              </span>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <span className="rounded-full bg-neutral-900 px-3 py-1 text-xs text-neutral-300">
                {integration.linkedWorkflows} linked workflow{integration.linkedWorkflows === 1 ? "" : "s"}
              </span>
              {typeof integration.connectedAccounts === "number" ? (
                <span className="rounded-full bg-neutral-900 px-3 py-1 text-xs text-neutral-300">
                  {integration.connectedAccounts} account{integration.connectedAccounts === 1 ? "" : "s"}
                </span>
              ) : null}
            </div>

            <div className="mt-4 rounded-2xl border border-neutral-800 bg-neutral-950/80 p-3 text-xs leading-6 text-neutral-400">
              Managed per workflow. Add, rotate, or switch these connections from the workflow builder instead of globally disconnecting them here.
            </div>

            <Button
              disabled
              className="mt-4 w-full rounded-2xl bg-neutral-900 text-neutral-300 hover:bg-neutral-900"
            >
              Managed in workflows
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
