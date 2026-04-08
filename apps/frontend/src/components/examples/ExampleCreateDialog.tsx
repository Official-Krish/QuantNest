import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { apiGetReusableSecrets } from "@/http";
import type { ReusableSecretService, ReusableSecretSummary, WorkflowExample } from "@/types/api";
import {
  getActionValidationErrors,
  getTradingValidationErrors,
} from "@/lib/validation";

export type ExampleMetadataOverrides = Record<string, Record<string, unknown>>;

type ExampleCreateDialogProps = {
  selectedExample: WorkflowExample | null;
  workflowName: string;
  executionMode: "live" | "dry-run";
  metadataOverrides: ExampleMetadataOverrides;
  creating: boolean;
  onWorkflowNameChange: (value: string) => void;
  onExecutionModeChange: (value: "live" | "dry-run") => void;
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

const SENSITIVE_FIELD_KEYS = new Set([
  "apiKey",
  "accessToken",
  "slackBotToken",
  "slackUserId",
  "telegramBotToken",
  "telegramChatId",
  "webhookUrl",
  "notionApiKey",
  "googleClientEmail",
  "googlePrivateKey",
]);

function isSensitiveField(fieldKey: string): boolean {
  return SENSITIVE_FIELD_KEYS.has(fieldKey);
}

function getReusableSecretServiceForAction(type: string): ReusableSecretService | null {
  switch (type) {
    case "zerodha":
    case "groww":
    case "lighter":
    case "slack":
    case "telegram":
    case "discord":
    case "whatsapp":
    case "notion-daily-report":
    case "google-drive-daily-csv":
      return type;
    default:
      return null;
  }
}

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
    case "slack":
      return "Slack";
    case "telegram":
      return "Telegram";
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
    case "slack":
      return [
        { key: "slackBotToken", label: "Bot token", placeholder: "xoxb-..." },
        { key: "slackUserId", label: "Slack user ID", placeholder: "U012ABCDEF" },
      ];
    case "telegram":
      return [
        {
          key: "telegramBotToken",
          label: "Bot token",
          placeholder: "123456789:telegram-bot-token",
        },
        { key: "telegramChatId", label: "Chat ID", placeholder: "859425297" },
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
    const baseMetadata = (node.data?.metadata || {}) as Record<string, unknown>;
    const sanitizedBaseMetadata = Object.fromEntries(
      Object.entries(baseMetadata).map(([key, value]) => [key, isSensitiveField(key) ? "" : value]),
    );
    const mergedMetadata = {
      ...sanitizedBaseMetadata,
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
  executionMode,
  metadataOverrides,
  creating,
  onWorkflowNameChange,
  onExecutionModeChange,
  onMetadataOverridesChange,
  onOpenChange,
  onCreate,
}: ExampleCreateDialogProps) {
  const [secretsByService, setSecretsByService] = useState<Partial<Record<ReusableSecretService, ReusableSecretSummary[]>>>({});

  useEffect(() => {
    if (!selectedExample) return;

    const services = Array.from(
      new Set(
        selectedExample.nodes
          .filter((node) => node.data?.kind === "action")
          .map((node) => getReusableSecretServiceForAction(String(node.type || "").toLowerCase()))
          .filter((service): service is ReusableSecretService => Boolean(service)),
      ),
    );

    if (!services.length) return;

    let cancelled = false;

    const load = async () => {
      const missing = services.filter((service) => !secretsByService[service]);
      if (!missing.length) return;

      const results = await Promise.all(
        missing.map(async (service) => [service, await apiGetReusableSecrets(service)] as const),
      );

      if (cancelled) return;

      setSecretsByService((current) => ({
        ...current,
        ...Object.fromEntries(results),
      }));
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [selectedExample, secretsByService]);

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

          <div className="space-y-2">
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-[#f17463]">
              Execution mode
            </p>
            <Select
              value={executionMode}
              onValueChange={(value) => onExecutionModeChange(value as "live" | "dry-run")}
            >
              <SelectTrigger className="h-10 border-neutral-800 bg-neutral-900 text-sm text-neutral-100">
                <SelectValue placeholder="Select execution mode" />
              </SelectTrigger>
              <SelectContent className="border-neutral-800 bg-neutral-950 text-neutral-100">
                <SelectItem value="live">Live mode</SelectItem>
                <SelectItem value="dry-run">Dry run mode</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-[11px] text-neutral-500">
              Dry run simulates external actions and logs payloads without placing trades or sending messages.
            </p>
          </div>

          {selectedExample?.nodes
            .filter((node) => node.data?.kind === "action")
            .map((node) => {
              const nodeType = String(node.type || "").toLowerCase();
              const fields = getFieldsForAction(nodeType);
              if (!fields.length) return null;

              const baseMetadata = (node.data?.metadata || {}) as Record<string, unknown>;
              const overrideMetadata = metadataOverrides[node.nodeId] || {};
              const service = getReusableSecretServiceForAction(nodeType);
              const availableSecrets = service ? (secretsByService[service] || []) : [];
              const currentSecretId = Object.prototype.hasOwnProperty.call(overrideMetadata, "secretId")
                ? String(overrideMetadata.secretId || "").trim()
                : String(baseMetadata.secretId || "").trim();
              const hasValidSecretId =
                currentSecretId.length > 0 && availableSecrets.some((secret) => secret.id === currentSecretId);

              return (
                <div
                  key={node.nodeId}
                  className="rounded-2xl border border-neutral-800 bg-neutral-950/70 p-4"
                >
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#f17463]">
                    {getActionLabel(nodeType)}
                  </p>

                  {service ? (
                    <div className="mt-3 space-y-2">
                      <p className="text-xs text-neutral-300">Reusable secret</p>
                      <Select
                        value={hasValidSecretId ? currentSecretId : "manual"}
                        onValueChange={(value) =>
                          onMetadataOverridesChange({
                            ...metadataOverrides,
                            [node.nodeId]: {
                              ...(metadataOverrides[node.nodeId] || {}),
                              secretId: value === "manual" ? "" : value,
                            },
                          })
                        }
                      >
                        <SelectTrigger className="h-10 border-neutral-800 bg-neutral-900 text-sm text-neutral-100">
                          <SelectValue placeholder="Use one-time values" />
                        </SelectTrigger>
                        <SelectContent className="border-neutral-800 bg-neutral-950 text-neutral-100">
                          <SelectItem value="manual">Use one-time values</SelectItem>
                          {availableSecrets.map((secret) => (
                            <SelectItem key={secret.id} value={secret.id}>
                              {secret.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {hasValidSecretId ? (
                        <div className="text-[11px] text-[#f7b2a7]">
                          Credentials will resolve from this saved secret at runtime.
                        </div>
                      ) : null}
                    </div>
                  ) : null}

                  {hasValidSecretId ? null : (
                  <div className="mt-3 grid gap-3 md:grid-cols-2">
                    {fields.map((field) => {
                      const fallbackBaseValue = isSensitiveField(field.key)
                        ? ""
                        : (baseMetadata[field.key] ?? "");
                      const value =
                        overrideMetadata[field.key] ??
                        fallbackBaseValue ??
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
                  )}

                  {["notion-daily-report", "google-drive-daily-csv"].includes(nodeType) ? (
                    <label className="mt-4 flex items-center gap-2 text-sm text-neutral-300">
                      <Checkbox
                        checked={Boolean(
                          metadataOverrides[node.nodeId]?.aiConsent ??
                          (baseMetadata.aiConsent as boolean | undefined),
                        )}
                        onCheckedChange={(value) =>
                          onMetadataOverridesChange({
                            ...metadataOverrides,
                            [node.nodeId]: {
                              ...(metadataOverrides[node.nodeId] || {}),
                              aiConsent: value === true,
                            },
                          })
                        }
                        className="border-neutral-600 data-[state=checked]:border-[#f17463] data-[state=checked]:bg-[#f17463]"
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
