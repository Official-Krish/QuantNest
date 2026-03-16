import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import type { WorkflowExample } from "@/types/api";
import {
  getActionValidationErrors,
  getTradingValidationErrors,
} from "@/lib/validation";

export type ExampleMetadataOverrides = Record<string, Record<string, unknown>>;

type ExampleCreateDialogProps = {
  selectedExample: WorkflowExample | null;
  workflowName: string;
  metadataOverrides: ExampleMetadataOverrides;
  creating: boolean;
  onWorkflowNameChange: (value: string) => void;
  onMetadataOverridesChange: (value: ExampleMetadataOverrides) => void;
  onOpenChange: (open: boolean) => void;
  onCreate: () => void;
};

type FieldConfig = {
  key: string;
  label: string;
  placeholder: string;
  type?: "text" | "password" | "number";
  optional?: boolean;
};

function getActionLabel(type: string) {
  switch (type) {
    case "zerodha":
      return "Zerodha";
    case "groww":
      return "Groww";
    case "lighter":
      return "Lighter";
    case "gmail":
      return "Gmail";
    case "discord":
      return "Discord";
    case "whatsapp":
      return "WhatsApp";
    case "notion-daily-report":
      return "Notion";
    case "google-drive-daily-csv":
      return "Google Drive";
    default:
      return type;
  }
}

function getFieldsForAction(type: string): FieldConfig[] {
  switch (type) {
    case "zerodha":
      return [
        { key: "apiKey", label: "API key", placeholder: "Enter Zerodha API key" },
        { key: "accessToken", label: "Access token", placeholder: "Enter Zerodha access token" },
      ];
    case "groww":
      return [
        { key: "accessToken", label: "Access token", placeholder: "Enter Groww access token" },
      ];
    case "lighter":
      return [
        { key: "apiKey", label: "API key", placeholder: "Enter Lighter API key" },
        { key: "accountIndex", label: "Account index", placeholder: "0", type: "number" },
        { key: "apiKeyIndex", label: "API key index", placeholder: "0", type: "number" },
      ];
    case "gmail":
      return [
        { key: "recipientEmail", label: "Recipient email", placeholder: "alerts@example.com" },
      ];
    case "discord":
      return [
        { key: "webhookUrl", label: "Webhook URL", placeholder: "https://discord.com/api/webhooks/..." },
      ];
    case "whatsapp":
      return [
        { key: "recipientPhone", label: "Recipient phone", placeholder: "+919999999999" },
      ];
    case "notion-daily-report":
      return [
        { key: "notionApiKey", label: "Notion API key", placeholder: "secret_xxx" },
        { key: "parentPageId", label: "Parent page ID", placeholder: "Enter parent page ID" },
      ];
    case "google-drive-daily-csv":
      return [
        {
          key: "googleClientEmail",
          label: "Service account email",
          placeholder: "example@project.iam.gserviceaccount.com",
        },
        {
          key: "googlePrivateKey",
          label: "Private key",
          placeholder: "-----BEGIN PRIVATE KEY-----",
        },
        {
          key: "googleDriveFolderId",
          label: "Drive folder ID",
          placeholder: "Optional folder id",
          optional: true,
        },
      ];
    default:
      return [];
  }
}

function collectDialogErrors(
  selectedExample: WorkflowExample | null,
  workflowName: string,
  metadataOverrides: ExampleMetadataOverrides,
) {
  const errors: string[] = [];

  if (!workflowName.trim()) {
    errors.push("Workflow name is required.");
  }

  if (!selectedExample) {
    return errors;
  }

  for (const node of selectedExample.nodes) {
    if (node.data?.kind !== "action") continue;
    const nodeType = String(node.type || "").toLowerCase();
    const mergedMetadata = {
      ...(node.data?.metadata || {}),
      ...(metadataOverrides[node.nodeId] || {}),
    };

    if (["zerodha", "groww", "lighter"].includes(nodeType)) {
      errors.push(...getTradingValidationErrors(nodeType as any, mergedMetadata as any));
    } else {
      errors.push(...getActionValidationErrors(nodeType, mergedMetadata));
    }
  }

  return [...new Set(errors)];
}

export function ExampleCreateDialog({
  selectedExample,
  workflowName,
  metadataOverrides,
  creating,
  onWorkflowNameChange,
  onMetadataOverridesChange,
  onOpenChange,
  onCreate,
}: ExampleCreateDialogProps) {
  const errors = collectDialogErrors(selectedExample, workflowName, metadataOverrides);

  const setFieldValue = (nodeId: string, key: string, rawValue: string, type?: string) => {
    const nextValue = type === "number" ? Number(rawValue) : rawValue;
    onMetadataOverridesChange({
      ...metadataOverrides,
      [nodeId]: {
        ...(metadataOverrides[nodeId] || {}),
        [key]: nextValue,
      },
    });
  };

  return (
    <Dialog open={!!selectedExample} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl border-neutral-800 bg-neutral-900 text-neutral-100">
        <DialogHeader>
          <DialogTitle>Name this workflow</DialogTitle>
          <DialogDescription className="text-neutral-400">
            {selectedExample
              ? `We will copy "${selectedExample.title}" into your workspace as a paused workflow.`
              : "Give your copied workflow a name."}
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[70vh] space-y-5 overflow-y-auto pr-1">
          <div className="py-1">
            <Input
              autoFocus
              value={workflowName}
              onChange={(e) => onWorkflowNameChange(e.target.value)}
              placeholder="Enter workflow name"
              className="bg-neutral-800 text-neutral-100 placeholder:text-neutral-500"
            />
          </div>

          {selectedExample?.nodes
            .filter((node) => node.data?.kind === "action")
            .map((node) => {
              const nodeType = String(node.type || "").toLowerCase();
              const fields = getFieldsForAction(nodeType);
              if (!fields.length) return null;

              const baseMetadata = (node.data?.metadata || {}) as Record<string, unknown>;
              const overrideMetadata = metadataOverrides[node.nodeId] || {};

              return (
                <div
                  key={node.nodeId}
                  className="rounded-2xl border border-neutral-800 bg-neutral-950/70 p-4"
                >
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#f17463]">
                    {getActionLabel(nodeType)}
                  </p>
                  <div className="mt-3 grid gap-3 md:grid-cols-2">
                    {fields.map((field) => {
                      const value =
                        overrideMetadata[field.key] ??
                        baseMetadata[field.key] ??
                        "";

                      return (
                        <div key={`${node.nodeId}-${field.key}`} className="space-y-2">
                          <p className="text-xs text-neutral-300">{field.label}</p>
                          <Input
                            type={field.type || "text"}
                            value={String(value)}
                            onChange={(e) =>
                              setFieldValue(node.nodeId, field.key, e.target.value, field.type)
                            }
                            placeholder={field.placeholder}
                            className="bg-neutral-900 text-neutral-100 placeholder:text-neutral-500"
                          />
                        </div>
                      );
                    })}
                  </div>

                  {["notion-daily-report", "google-drive-daily-csv"].includes(nodeType) ? (
                    <label className="mt-4 flex items-center gap-2 text-sm text-neutral-300">
                      <input
                        type="checkbox"
                        checked={Boolean(
                          metadataOverrides[node.nodeId]?.aiConsent ??
                          (baseMetadata.aiConsent as boolean | undefined),
                        )}
                        onChange={(e) =>
                          onMetadataOverridesChange({
                            ...metadataOverrides,
                            [node.nodeId]: {
                              ...(metadataOverrides[node.nodeId] || {}),
                              aiConsent: e.target.checked,
                            },
                          })
                        }
                      />
                      <span>AI consent provided for this action</span>
                    </label>
                  ) : null}
                </div>
              );
            })}

          {errors.length > 0 ? (
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-200">
              <p className="font-medium">Complete these fields before creating:</p>
              <ul className="mt-2 list-disc space-y-1 pl-5">
                {errors.map((error) => (
                  <li key={error}>{error}</li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>

        <DialogFooter>
          <button
            type="button"
            className="rounded-lg border border-neutral-700 bg-neutral-800 px-4 py-2 text-sm text-neutral-300 transition hover:bg-neutral-700 hover:text-neutral-100"
            onClick={() => onOpenChange(false)}
            disabled={creating}
          >
            Cancel
          </button>
          <button
            type="button"
            className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-neutral-900 transition hover:bg-neutral-200 disabled:opacity-50 cursor-pointer disabled:pointer-events-none"
            onClick={onCreate}
            disabled={errors.length > 0 || creating}
          >
            {creating ? "Creating..." : "Create workflow"}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
