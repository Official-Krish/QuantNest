import { useEffect, useState } from "react";
import { apiGetGoogleSheetsServiceAccount, apiGetReusableSecrets, apiVerifyGoogleSheets } from "@/http";
import type { ReusableSecretService, ReusableSecretSummary } from "@/types/api";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { AiPlanSetupDialogProps } from "./types";
import {
  collectSetupErrors,
  getFieldLabel,
  getFieldType,
  getGoogleSheetsVerificationErrorDetails,
  getNodeLabel,
  getReusableSecretServiceForNodeType,
  groupMissingInputs,
  isGoogleSheetsReportNodeType,
  shouldHideInputWhenSecretSelected,
  suggestReusableSecretId,
} from "./setupDialog.utils";
import { toast } from "sonner";
import { TelegramChatLookup } from "@/components/workflow/sheets/TelegramChatLookup";

export function AiPlanSetupDialog({
  open,
  result,
  workflowName,
  metadataOverrides,
  onOpenChange,
  onWorkflowNameChange,
  onMetadataOverridesChange,
  onContinue,
}: AiPlanSetupDialogProps) {
  const errors = collectSetupErrors(result, workflowName, metadataOverrides);
  const groupedInputs = groupMissingInputs(result);
  const response = result && "response" in result ? result.response : result;
  const [secretsByService, setSecretsByService] = useState<Partial<Record<ReusableSecretService, ReusableSecretSummary[]>>>({});
  const [googleSheetsServiceAccountEmail, setGoogleSheetsServiceAccountEmail] = useState("");
  const [googleSheetsVerifyingByNode, setGoogleSheetsVerifyingByNode] = useState<Record<string, boolean>>({});
  const [googleSheetsVerifySuccessByNode, setGoogleSheetsVerifySuccessByNode] = useState<Record<string, string>>({});
  const [copiedGoogleSheetsNodeId, setCopiedGoogleSheetsNodeId] = useState<string | null>(null);

  useEffect(() => {
    if (!response) return;

    const services = Array.from(
      new Set(
        Object.keys(groupedInputs)
          .map((nodeId) => {
            const node = response.plan.nodes.find((entry) => entry.nodeId === nodeId);
            return node ? getReusableSecretServiceForNodeType(String(node.type)) : null;
          })
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
  }, [response, groupedInputs, secretsByService]);

  useEffect(() => {
    if (!response || googleSheetsServiceAccountEmail) return;

    const hasGoogleSheetsNode = response.plan.nodes.some((node) =>
      isGoogleSheetsReportNodeType(String(node.type)),
    );
    if (!hasGoogleSheetsNode) return;

    let cancelled = false;

    const loadServiceAccount = async () => {
      try {
        const account = await apiGetGoogleSheetsServiceAccount();
        if (!cancelled) {
          setGoogleSheetsServiceAccountEmail(account.serviceAccountEmail || "");
        }
      } catch {
        // Keep dialog functional even when helper endpoint is temporarily unavailable.
      }
    };

    void loadServiceAccount();

    return () => {
      cancelled = true;
    };
  }, [googleSheetsServiceAccountEmail, response]);

  useEffect(() => {
    if (!response) return;

    const nextOverrides = { ...metadataOverrides };
    let changed = false;

    for (const [nodeId] of Object.entries(groupedInputs)) {
      const node = response.plan.nodes.find((entry) => entry.nodeId === nodeId);
      if (!node) continue;

      const service = getReusableSecretServiceForNodeType(String(node.type));
      if (!service || !(service in secretsByService)) continue;

      const baseMetadata = node.data.metadata || {};
      const overrideMetadata = metadataOverrides[nodeId] || {};
      const resolvedSecretId = Object.prototype.hasOwnProperty.call(overrideMetadata, "secretId")
        ? String(overrideMetadata.secretId || "").trim()
        : String(baseMetadata.secretId || "").trim();

      if (!resolvedSecretId) continue;

      const isValid = (secretsByService[service] || []).some((secret) => secret.id === resolvedSecretId);
      if (isValid) continue;

      nextOverrides[nodeId] = {
        ...overrideMetadata,
        secretId: "",
      };
      changed = true;
    }

    if (changed) {
      onMetadataOverridesChange(nextOverrides);
    }
  }, [groupedInputs, metadataOverrides, onMetadataOverridesChange, response, secretsByService]);

  const setFieldValue = (nodeId: string, key: string, rawValue: string, type: string) => {
    const nextValue = type === "number" ? Number(rawValue) : rawValue;

    if (key === "sheetUrl") {
      setGoogleSheetsVerifySuccessByNode((current) => {
        const next = { ...current };
        delete next[nodeId];
        return next;
      });
    }

    onMetadataOverridesChange({
      ...metadataOverrides,
      [nodeId]: {
        ...(metadataOverrides[nodeId] || {}),
        [key]: nextValue,
      },
    });
  };

  const verifyGoogleSheetNode = async (
    nodeId: string,
    baseMetadata: Record<string, unknown>,
    overrideMetadata: Record<string, unknown>,
  ) => {
    const sheetUrl = String(overrideMetadata.sheetUrl ?? baseMetadata.sheetUrl ?? "").trim();
    if (!sheetUrl) {
      toast.error("Google Sheet verification failed", {
        description: "Please paste a valid Google Sheet link.",
      });
      return;
    }

    setGoogleSheetsVerifyingByNode((current) => ({ ...current, [nodeId]: true }));
    setGoogleSheetsVerifySuccessByNode((current) => {
      const next = { ...current };
      delete next[nodeId];
      return next;
    });

    try {
      const verifyResponse = await apiVerifyGoogleSheets({ sheetUrl });

      onMetadataOverridesChange({
        ...metadataOverrides,
        [nodeId]: {
          ...(metadataOverrides[nodeId] || {}),
          sheetId: verifyResponse.sheet.sheetId,
          sheetName: verifyResponse.sheet.sheetName,
          serviceAccountEmail: verifyResponse.sheet.serviceAccountEmail,
        },
      });

      setGoogleSheetsServiceAccountEmail(verifyResponse.sheet.serviceAccountEmail || "");
      setGoogleSheetsVerifySuccessByNode((current) => ({
        ...current,
        [nodeId]: `Verified: ${verifyResponse.sheet.spreadsheetTitle} (${verifyResponse.sheet.sheetName})`,
      }));

      toast.success("Google Sheet verified", {
        description: `${verifyResponse.sheet.spreadsheetTitle} (${verifyResponse.sheet.sheetName})`,
      });
    } catch (error) {
      const { friendlyMessage, serviceAccountEmail } = getGoogleSheetsVerificationErrorDetails(error);

      if (serviceAccountEmail) {
        setGoogleSheetsServiceAccountEmail(serviceAccountEmail);
        onMetadataOverridesChange({
          ...metadataOverrides,
          [nodeId]: {
            ...(metadataOverrides[nodeId] || {}),
            serviceAccountEmail,
          },
        });
      }

      toast.error("Google Sheet verification failed", {
        description: friendlyMessage,
      });
    } finally {
      setGoogleSheetsVerifyingByNode((current) => ({
        ...current,
        [nodeId]: false,
      }));
    }
  };

  const copyGoogleSheetsServiceAccount = async (nodeId: string, email: string) => {
    if (!email) return;

    try {
      await navigator.clipboard.writeText(email);
      setCopiedGoogleSheetsNodeId(nodeId);
      setTimeout(() => {
        setCopiedGoogleSheetsNodeId((current) => (current === nodeId ? null : current));
      }, 1500);
    } catch {
      toast.error("Could not copy service account email", {
        description: "Please copy it manually.",
      });
    }
  };

  const setSecretId = (nodeId: string, secretId?: string) => {
    const nextNodeOverrides = { ...(metadataOverrides[nodeId] || {}) };
    if (secretId !== undefined) {
      nextNodeOverrides.secretId = secretId;
    } else {
      delete nextNodeOverrides.secretId;
    }

    onMetadataOverridesChange({
      ...metadataOverrides,
      [nodeId]: nextNodeOverrides,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl border-neutral-800 bg-neutral-900 text-neutral-100">
        <DialogHeader>
          <DialogTitle>Complete this workflow draft</DialogTitle>
          <DialogDescription className="text-neutral-400">
            Add the workflow name and any required credentials before opening the builder.
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[70vh] space-y-5 overflow-y-auto pr-1">
          <div className="space-y-2">
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-[#f17463]">
              Workflow name
            </p>
            <Input
              autoFocus
              value={workflowName}
              onChange={(e) => onWorkflowNameChange(e.target.value)}
              placeholder="Enter workflow name"
              className="bg-neutral-800 text-neutral-100 placeholder:text-neutral-500"
            />
          </div>

          {Object.entries(groupedInputs).map(([nodeId, inputs]) => {
            const node = response?.plan.nodes.find((entry) => entry.nodeId === nodeId);
            if (!node) return null;

            const baseMetadata = node.data.metadata || {};
            const overrideMetadata = metadataOverrides[nodeId] || {};
            const nodeType = String(node.type);
            const normalizedNodeType = nodeType.toLowerCase();
            const isGoogleSheetsNode = isGoogleSheetsReportNodeType(nodeType);
            const isTelegramNode = normalizedNodeType === "telegram";
            const service = getReusableSecretServiceForNodeType(nodeType);
            const availableSecrets = service ? (secretsByService[service] || []) : [];
            const currentSecretId = Object.prototype.hasOwnProperty.call(overrideMetadata, "secretId")
              ? String(overrideMetadata.secretId || "").trim()
              : String(baseMetadata.secretId || "").trim();
            const hasValidSecretId = currentSecretId.length > 0 && availableSecrets.some((secret) => secret.id === currentSecretId);
            const suggestedSecretId = hasValidSecretId ? null : suggestReusableSecretId(availableSecrets, inputs);
            const suggestedSecret = suggestedSecretId
              ? availableSecrets.find((secret) => secret.id === suggestedSecretId)
              : null;
            const googleSheetsServiceEmail = String(
              overrideMetadata.serviceAccountEmail ??
              baseMetadata.serviceAccountEmail ??
              googleSheetsServiceAccountEmail,
            ).trim();
            const isVerifyingGoogleSheet = Boolean(googleSheetsVerifyingByNode[nodeId]);
            const googleSheetsVerifySuccess = googleSheetsVerifySuccessByNode[nodeId] || "";
            const telegramBotToken = String(
              overrideMetadata.telegramBotToken ?? baseMetadata.telegramBotToken ?? "",
            ).trim();
            const telegramChatId = String(
              overrideMetadata.telegramChatId ?? baseMetadata.telegramChatId ?? "",
            ).trim();

            return (
              <div key={nodeId} className="rounded-2xl border border-neutral-800 bg-neutral-950/70 p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#f17463]">
                  {getNodeLabel(nodeType)}
                </p>

                {service ? (
                  <div className="mt-3 space-y-2">
                    <p className="text-xs text-neutral-300">Reusable secret</p>
                    <Select
                      value={hasValidSecretId ? currentSecretId : "manual"}
                      onValueChange={(value) => setSecretId(nodeId, value === "manual" ? "" : value)}
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
                    ) : currentSecretId ? (
                      <div className="text-[11px] text-amber-300">
                        This saved secret is no longer available. Choose another secret or enter values manually.
                      </div>
                    ) : suggestedSecret ? (
                      <button
                        type="button"
                        className="rounded-lg border border-[#f17463]/35 bg-[#f17463]/8 px-2.5 py-1 text-[11px] text-[#f7b2a7] transition hover:border-[#f17463]/55"
                        onClick={() => setSecretId(nodeId, suggestedSecret.id)}
                      >
                        Use suggested: {suggestedSecret.name}
                      </button>
                    ) : null}
                  </div>
                ) : null}

                <div className="mt-3 grid gap-3 md:grid-cols-2">
                  {inputs
                    .filter((input) => !shouldHideInputWhenSecretSelected(nodeType, input.field, hasValidSecretId))
                    .map((input) => {
                    if (input.field === "aiConsent") {
                      const checked = Boolean(overrideMetadata.aiConsent ?? baseMetadata.aiConsent);
                      return (
                        <label
                          key={`${nodeId}-${input.field}`}
                          className="flex items-center gap-2 rounded-xl border border-neutral-800 bg-black px-3 py-3 text-sm text-neutral-300"
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={(e) =>
                              onMetadataOverridesChange({
                                ...metadataOverrides,
                                [nodeId]: {
                                  ...(metadataOverrides[nodeId] || {}),
                                  aiConsent: e.target.checked,
                                },
                              })
                            }
                          />
                          <span>{input.label || getFieldLabel(input.field)}</span>
                        </label>
                      );
                    }

                    const type = getFieldType(input.field, input.secret);
                    const value = overrideMetadata[input.field] ?? baseMetadata[input.field] ?? "";

                    return (
                      <div key={`${nodeId}-${input.field}`} className="space-y-2">
                        <p className="text-xs text-neutral-300">
                          {input.label || getFieldLabel(input.field)}
                        </p>
                        <Input
                          type={type}
                          value={String(value)}
                          onChange={(e) => setFieldValue(nodeId, input.field, e.target.value, type)}
                          placeholder={input.reason}
                          className="bg-neutral-900 text-neutral-100 placeholder:text-neutral-500"
                        />
                      </div>
                    );
                    })}
                </div>

                {isTelegramNode && !hasValidSecretId ? (
                  <div className="mt-3">
                    <TelegramChatLookup
                      botToken={telegramBotToken}
                      selectedChatId={telegramChatId}
                      compact
                      onSelectChat={(chat) =>
                        onMetadataOverridesChange({
                          ...metadataOverrides,
                          [nodeId]: {
                            ...(metadataOverrides[nodeId] || {}),
                            telegramChatId: chat.id,
                            recipientName: String(
                              (metadataOverrides[nodeId] as Record<string, unknown> | undefined)?.recipientName ||
                              overrideMetadata.recipientName ||
                              baseMetadata.recipientName ||
                              "",
                            ).trim() || chat.title,
                          },
                        })
                      }
                    />
                  </div>
                ) : null}

                {isGoogleSheetsNode ? (
                  <div className="mt-3 space-y-2">
                    <button
                      type="button"
                      onClick={() => verifyGoogleSheetNode(nodeId, baseMetadata, overrideMetadata)}
                      disabled={isVerifyingGoogleSheet}
                      className="w-full cursor-pointer rounded-lg bg-neutral-100 px-3 py-2 text-xs font-medium text-neutral-900 transition hover:bg-neutral-200 disabled:pointer-events-none disabled:opacity-60"
                    >
                      {isVerifyingGoogleSheet ? "Verifying access..." : "Verify Sheet Access"}
                    </button>

                    {googleSheetsVerifySuccess ? (
                      <div className="rounded-lg border border-emerald-500/35 bg-emerald-500/10 p-2 text-[11px] text-emerald-200">
                        {googleSheetsVerifySuccess}
                      </div>
                    ) : null}

                    <div className="rounded-lg border border-neutral-700/50 bg-neutral-900/30 p-2">
                      <p className="text-[11px] text-neutral-400">
                        Share your Google Sheet with this service account as Editor before verification.
                      </p>
                      {googleSheetsServiceEmail ? (
                        <div className="mt-2 flex items-center justify-between gap-2 rounded-md border border-neutral-700/70 bg-black/30 px-2 py-2">
                          <p className="truncate text-[11px] text-neutral-200">{googleSheetsServiceEmail}</p>
                          <button
                            type="button"
                            onClick={() => copyGoogleSheetsServiceAccount(nodeId, googleSheetsServiceEmail)}
                            className="cursor-pointer rounded-md border border-neutral-700 bg-neutral-900 px-2 py-1 text-[11px] text-neutral-100 transition hover:bg-neutral-800"
                          >
                            {copiedGoogleSheetsNodeId === nodeId ? "Copied" : "Copy"}
                          </button>
                        </div>
                      ) : (
                        <p className="mt-1 text-[11px] text-neutral-500">
                          Service account email will appear once backend configuration is loaded.
                        </p>
                      )}
                    </div>
                  </div>
                ) : null}
              </div>
            );
          })}

          {errors.length > 0 ? (
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-200">
              <p className="font-medium">Complete these fields before continuing:</p>
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
            className="cursor-pointer rounded-lg border border-neutral-700 bg-neutral-800 px-4 py-2 text-sm text-neutral-300 transition hover:bg-neutral-700 hover:text-neutral-100"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </button>
          <button
            type="button"
            className="cursor-pointer rounded-lg bg-white px-4 py-2 text-sm font-medium text-neutral-900 transition hover:bg-neutral-200 disabled:pointer-events-none disabled:opacity-50"
            onClick={onContinue}
            disabled={errors.length > 0}
          >
            Open in builder
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
