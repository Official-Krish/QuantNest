import { useEffect, useState } from "react";
import { apiGetReusableSecrets } from "@/http";
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
  getNodeLabel,
  getReusableSecretServiceForNodeType,
  groupMissingInputs,
  shouldHideInputWhenSecretSelected,
  suggestReusableSecretId,
} from "./setupDialog.utils";

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
    onMetadataOverridesChange({
      ...metadataOverrides,
      [nodeId]: {
        ...(metadataOverrides[nodeId] || {}),
        [key]: nextValue,
      },
    });
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
