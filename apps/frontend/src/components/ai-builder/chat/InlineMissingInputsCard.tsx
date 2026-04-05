import { useEffect, useState } from "react";
import {
  apiGetGoogleSheetsServiceAccount,
  apiGetReusableSecrets,
  apiVerifyGoogleSheets,
} from "@/http";
import type {
  AiStrategyDraftSession,
  ReusableSecretService,
  ReusableSecretSummary,
} from "@/types/api";
import type { AiMetadataOverrides } from "@/components/ai-builder/types";
import {
  getFieldLabel,
  getGoogleSheetsVerificationErrorDetails,
  getNodeLabel,
  getRequiredMissingInputsCount,
  getReusableSecretServiceForNodeType,
  groupMissingInputs,
  isGoogleSheetsReportNodeType,
  shouldHideInputWhenSecretSelected,
  suggestReusableSecretId,
} from "@/components/ai-builder/setupDialog.utils";
import {
  getAiSetupFieldType,
  getSecretHelperText,
} from "@/components/ai-builder/aiSetupFieldRegistry";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CircleHelp } from "lucide-react";
import { toast } from "sonner";
import { cx, type LocalTheme } from "./shared";

type InlineMissingInputsCardProps = {
  activeDraft: AiStrategyDraftSession;
  metadataOverrides: AiMetadataOverrides;
  onMetadataOverridesChange: (value: AiMetadataOverrides) => void;
  theme: LocalTheme;
};

export function InlineMissingInputsCard({
  activeDraft,
  metadataOverrides,
  onMetadataOverridesChange,
  theme,
}: InlineMissingInputsCardProps) {
  const groupedInputs = groupMissingInputs(activeDraft);
  const entries = Object.entries(groupedInputs);
  const [secretsByService, setSecretsByService] = useState<
    Partial<Record<ReusableSecretService, ReusableSecretSummary[]>>
  >({});
  const [googleSheetsServiceAccountEmail, setGoogleSheetsServiceAccountEmail] =
    useState("");
  const [googleSheetsVerifyingByNode, setGoogleSheetsVerifyingByNode] =
    useState<Record<string, boolean>>({});
  const [googleSheetsVerifySuccessByNode, setGoogleSheetsVerifySuccessByNode] =
    useState<Record<string, string>>({});
  const [copiedGoogleSheetsNodeId, setCopiedGoogleSheetsNodeId] = useState<
    string | null
  >(null);

  const hasGoogleSheetsNode = entries.some(([nodeId]) => {
    const node = activeDraft.response.plan.nodes.find(
      (entry) => entry.nodeId === nodeId,
    );
    return node ? isGoogleSheetsReportNodeType(String(node.type)) : false;
  });

  const servicesToLoad = Array.from(
    new Set(
      entries
        .map(([nodeId]) => {
          const node = activeDraft.response.plan.nodes.find(
            (entry) => entry.nodeId === nodeId,
          );
          return node
            ? getReusableSecretServiceForNodeType(String(node.type))
            : null;
        })
        .filter(
          (service): service is ReusableSecretService => Boolean(service),
        ),
    ),
  );

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      const missing = servicesToLoad.filter((service) => !secretsByService[service]);
      if (!missing.length) return;

      const results = await Promise.all(
        missing.map(
          async (service) =>
            [service, await apiGetReusableSecrets(service)] as const,
        ),
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
  }, [servicesToLoad.join("|"), secretsByService]);

  useEffect(() => {
    if (!hasGoogleSheetsNode || googleSheetsServiceAccountEmail) return;

    let cancelled = false;

    const loadServiceAccount = async () => {
      try {
        const response = await apiGetGoogleSheetsServiceAccount();
        if (!cancelled) {
          setGoogleSheetsServiceAccountEmail(response.serviceAccountEmail || "");
        }
      } catch {
        // Keep setup usable even when the helper endpoint is temporarily unavailable.
      }
    };

    void loadServiceAccount();

    return () => {
      cancelled = true;
    };
  }, [hasGoogleSheetsNode, googleSheetsServiceAccountEmail]);

  useEffect(() => {
    const nextOverrides = { ...metadataOverrides };
    let changed = false;

    for (const [nodeId] of entries) {
      const node = activeDraft.response.plan.nodes.find(
        (entry) => entry.nodeId === nodeId,
      );
      if (!node) continue;

      const service = getReusableSecretServiceForNodeType(String(node.type));
      if (!service || !(service in secretsByService)) continue;

      const baseMetadata = node.data.metadata || {};
      const overrideMetadata = metadataOverrides[nodeId] || {};
      const resolvedSecretId = Object.prototype.hasOwnProperty.call(
        overrideMetadata,
        "secretId",
      )
        ? String(overrideMetadata.secretId || "").trim()
        : String(baseMetadata.secretId || "").trim();

      if (!resolvedSecretId) continue;

      const isValid = (secretsByService[service] || []).some(
        (secret) => secret.id === resolvedSecretId,
      );
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
  }, [
    activeDraft.response.plan.nodes,
    entries,
    metadataOverrides,
    onMetadataOverridesChange,
    secretsByService,
  ]);

  const setFieldValue = (
    nodeId: string,
    key: string,
    rawValue: string,
    type: string,
  ) => {
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
    const sheetUrl = String(
      overrideMetadata.sheetUrl ?? baseMetadata.sheetUrl ?? "",
    ).trim();
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
      const response = await apiVerifyGoogleSheets({ sheetUrl });

      onMetadataOverridesChange({
        ...metadataOverrides,
        [nodeId]: {
          ...(metadataOverrides[nodeId] || {}),
          sheetId: response.sheet.sheetId,
          sheetName: response.sheet.sheetName,
          serviceAccountEmail: response.sheet.serviceAccountEmail,
        },
      });

      setGoogleSheetsServiceAccountEmail(response.sheet.serviceAccountEmail || "");
      setGoogleSheetsVerifySuccessByNode((current) => ({
        ...current,
        [nodeId]: `Verified: ${response.sheet.spreadsheetTitle} (${response.sheet.sheetName})`,
      }));

      toast.success("Google Sheet verified", {
        description: `${response.sheet.spreadsheetTitle} (${response.sheet.sheetName})`,
      });
    } catch (error) {
      const { friendlyMessage, serviceAccountEmail } =
        getGoogleSheetsVerificationErrorDetails(error);
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
      setGoogleSheetsVerifyingByNode((current) => ({ ...current, [nodeId]: false }));
    }
  };

  const copyGoogleSheetsServiceAccount = async (nodeId: string, email: string) => {
    if (!email) return;

    try {
      await navigator.clipboard.writeText(email);
      setCopiedGoogleSheetsNodeId(nodeId);
      setTimeout(() => {
        setCopiedGoogleSheetsNodeId((current) =>
          current === nodeId ? null : current,
        );
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

  if (entries.length === 0) return null;

  return (
    <div
      className={cx(
        "rounded-2xl border p-4",
        theme === "dark" ? "border-neutral-800 bg-[#0d0d0d]" : "border-neutral-200 bg-white",
      )}
    >
      <div>
        <div>
          <div className="flex items-center gap-2 text-[10px] font-medium uppercase tracking-[0.16em] text-[#f17463]">
            <span>Setup needed</span>
            <span
              className={cx(
                "rounded-full px-2 py-0.5 text-[10px] normal-case tracking-normal",
                theme === "dark"
                  ? "bg-[#f17463]/15 text-[#f7b2a7]"
                  : "bg-[#fff2ed] text-[#d95f4f]",
              )}
            >
              {getRequiredMissingInputsCount(activeDraft)} required
            </span>
          </div>
          <div
            className={cx(
              "mt-1 text-sm",
              theme === "dark" ? "text-neutral-200" : "text-neutral-800",
            )}
          >
            Fill these required values inline and they will be saved to this draft automatically.
          </div>
        </div>
      </div>

      <div className="mt-4 space-y-3">
        {entries.map(([nodeId, inputs]) => {
          const node = activeDraft.response.plan.nodes.find(
            (entry) => entry.nodeId === nodeId,
          );
          if (!node) return null;
          const baseMetadata = node.data.metadata || {};
          const overrideMetadata = metadataOverrides[nodeId] || {};
          const service = getReusableSecretServiceForNodeType(String(node.type));
          const availableSecrets = service ? (secretsByService[service] || []) : [];
          const nodeType = String(node.type);
          const isGoogleSheetsNode = isGoogleSheetsReportNodeType(nodeType);
          const currentSecretId = Object.prototype.hasOwnProperty.call(
            overrideMetadata,
            "secretId",
          )
            ? String(overrideMetadata.secretId || "").trim()
            : String(baseMetadata.secretId || "").trim();
          const hasValidSecretId =
            currentSecretId.length > 0 &&
            availableSecrets.some((secret) => secret.id === currentSecretId);
          const suggestedSecretId = hasValidSecretId
            ? null
            : suggestReusableSecretId(availableSecrets, inputs);
          const suggestedSecret = suggestedSecretId
            ? availableSecrets.find((secret) => secret.id === suggestedSecretId)
            : null;
          const secretHelperText = getSecretHelperText(service);
          const googleSheetsServiceEmail = String(
            overrideMetadata.serviceAccountEmail ??
              baseMetadata.serviceAccountEmail ??
              googleSheetsServiceAccountEmail,
          ).trim();
          const isVerifyingGoogleSheet = Boolean(googleSheetsVerifyingByNode[nodeId]);
          const googleSheetsVerifySuccess = googleSheetsVerifySuccessByNode[nodeId] || "";

          return (
            <div
              key={nodeId}
              className={cx(
                "rounded-xl border p-3",
                theme === "dark"
                  ? "border-neutral-800 bg-black"
                  : "border-neutral-200 bg-[#fafafa]",
              )}
            >
              <div
                className={cx(
                  "mb-3 text-xs font-medium",
                  theme === "dark" ? "text-neutral-200" : "text-neutral-800",
                )}
              >
                {getNodeLabel(nodeType)}
              </div>

              {service ? (
                <div className="mb-3 space-y-2">
                  {secretHelperText ? (
                    <div
                      className={cx(
                        "inline-flex items-center gap-1.5 text-[11px]",
                        theme === "dark" ? "text-neutral-500" : "text-neutral-500",
                      )}
                    >
                      <CircleHelp className="h-3.5 w-3.5" />
                      <span>{secretHelperText}</span>
                    </div>
                  ) : null}
                  <Select
                    value={hasValidSecretId ? currentSecretId : "manual"}
                    onValueChange={(value) =>
                      setSecretId(nodeId, value === "manual" ? "" : value)
                    }
                  >
                    <SelectTrigger
                      className={cx(
                        "h-9 text-xs font-medium",
                        theme === "dark"
                          ? "border-neutral-700 bg-transparent text-neutral-300 hover:border-neutral-600"
                          : "border-neutral-300 bg-white text-neutral-700 hover:border-neutral-400",
                      )}
                    >
                      <SelectValue placeholder="Use one-time values" />
                    </SelectTrigger>
                    <SelectContent className="border-neutral-800 bg-[#0f0f0f] text-neutral-100">
                      <SelectItem value="manual" className="text-xs">
                        Use one-time values
                      </SelectItem>
                      {availableSecrets.map((secret) => (
                        <SelectItem key={secret.id} value={secret.id} className="text-xs">
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
                      onClick={() => setSecretId(nodeId, suggestedSecret.id)}
                      className={cx(
                        "rounded-lg border px-2.5 py-1 text-[11px] transition",
                        theme === "dark"
                          ? "border-[#f17463]/35 bg-[#f17463]/8 text-[#f7b2a7] hover:border-[#f17463]/55"
                          : "border-[#f17463]/30 bg-[#fff3ee] text-[#d95f4f] hover:border-[#f17463]/45",
                      )}
                    >
                      Use suggested: {suggestedSecret.name}
                    </button>
                  ) : null}
                </div>
              ) : null}

              <div className="grid gap-3 md:grid-cols-2">
                {inputs
                  .filter((input) =>
                    !shouldHideInputWhenSecretSelected(
                      nodeType,
                      input.field,
                      hasValidSecretId,
                    ),
                  )
                  .map((input) => {
                    const type = getAiSetupFieldType(input.field, input.secret);
                    const value =
                      overrideMetadata[input.field] ?? baseMetadata[input.field] ?? "";
                    return (
                      <label key={`${nodeId}-${input.field}`} className="space-y-1.5">
                        <span
                          className={cx(
                            "text-[11px]",
                            theme === "dark" ? "text-neutral-400" : "text-neutral-500",
                          )}
                        >
                          {input.label || getFieldLabel(input.field)}
                        </span>
                        <input
                          type={type}
                          value={String(value)}
                          onChange={(e) =>
                            setFieldValue(nodeId, input.field, e.target.value, type)
                          }
                          placeholder={input.reason}
                          className={cx(
                            "w-full rounded-xl border px-3 py-2 text-sm outline-none",
                            theme === "dark"
                              ? "border-neutral-800 bg-[#111111] text-neutral-100 placeholder:text-neutral-500"
                              : "border-neutral-200 bg-white text-neutral-900 placeholder:text-neutral-400",
                          )}
                        />
                      </label>
                    );
                  })}
              </div>

              {isGoogleSheetsNode ? (
                <div className="mt-3 space-y-2">
                  <button
                    type="button"
                    onClick={() =>
                      verifyGoogleSheetNode(nodeId, baseMetadata, overrideMetadata)
                    }
                    disabled={isVerifyingGoogleSheet}
                    className={cx(
                      "w-full rounded-xl px-3 py-2 text-xs font-medium transition",
                      theme === "dark"
                        ? "bg-neutral-100 text-neutral-900 hover:bg-neutral-200 disabled:opacity-60"
                        : "bg-neutral-900 text-neutral-100 hover:bg-neutral-700 disabled:opacity-60",
                    )}
                  >
                    {isVerifyingGoogleSheet
                      ? "Verifying access..."
                      : "Verify Sheet Access"}
                  </button>

                  {googleSheetsVerifySuccess ? (
                    <div
                      className={cx(
                        "rounded-lg border p-2 text-[11px]",
                        theme === "dark"
                          ? "border-emerald-500/35 bg-emerald-500/10 text-emerald-200"
                          : "border-emerald-300 bg-emerald-50 text-emerald-700",
                      )}
                    >
                      {googleSheetsVerifySuccess}
                    </div>
                  ) : null}

                  <div
                    className={cx(
                      "rounded-lg border p-2",
                      theme === "dark"
                        ? "border-neutral-700/50 bg-neutral-900/30"
                        : "border-neutral-200 bg-neutral-50",
                    )}
                  >
                    <p
                      className={cx(
                        "text-[11px]",
                        theme === "dark" ? "text-neutral-400" : "text-neutral-600",
                      )}
                    >
                      Share your Google Sheet with this service account as Editor before verification.
                    </p>
                    {googleSheetsServiceEmail ? (
                      <div
                        className={cx(
                          "mt-2 flex items-center justify-between gap-2 rounded-md border px-2 py-2",
                          theme === "dark"
                            ? "border-neutral-700/70 bg-black/30"
                            : "border-neutral-200 bg-white",
                        )}
                      >
                        <p
                          className={cx(
                            "truncate text-[11px]",
                            theme === "dark" ? "text-neutral-200" : "text-neutral-700",
                          )}
                        >
                          {googleSheetsServiceEmail}
                        </p>
                        <button
                          type="button"
                          onClick={() =>
                            copyGoogleSheetsServiceAccount(nodeId, googleSheetsServiceEmail)
                          }
                          className={cx(
                            "rounded-md border px-2 py-1 text-[11px] transition",
                            theme === "dark"
                              ? "border-neutral-700 bg-neutral-900 text-neutral-100 hover:bg-neutral-800"
                              : "border-neutral-300 bg-white text-neutral-700 hover:bg-neutral-100",
                          )}
                        >
                          {copiedGoogleSheetsNodeId === nodeId ? "Copied" : "Copy"}
                        </button>
                      </div>
                    ) : (
                      <p
                        className={cx(
                          "mt-1 text-[11px]",
                          theme === "dark" ? "text-neutral-500" : "text-neutral-500",
                        )}
                      >
                        Service account email will appear once backend configuration is loaded.
                      </p>
                    )}
                  </div>
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
