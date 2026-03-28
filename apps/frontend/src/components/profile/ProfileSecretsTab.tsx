import { useEffect, useMemo, useState } from "react";
import { KeyRound, Save, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  apiCreateReusableSecret,
  apiDeleteReusableSecret,
  apiGetReusableSecret,
  apiGetReusableSecrets,
  apiUpdateReusableSecret,
} from "@/http";
import type { ReusableSecretService, ReusableSecretSummary } from "@/types/api";

const SERVICE_FIELDS: Record<ReusableSecretService, Array<{ key: string; label: string; type?: "text" | "password" | "number" }>> = {
  zerodha: [
    { key: "apiKey", label: "API Key" },
    { key: "accessToken", label: "Access Token", type: "password" },
  ],
  groww: [
    { key: "accessToken", label: "Access Token", type: "password" },
  ],
  lighter: [
    { key: "apiKey", label: "API Key", type: "password" },
    { key: "accountIndex", label: "Account Index", type: "number" },
    { key: "apiKeyIndex", label: "API Key Index", type: "number" },
  ],
  slack: [
    { key: "slackBotToken", label: "Bot Token", type: "password" },
    { key: "slackUserId", label: "Slack User ID" },
  ],
  discord: [
    { key: "webhookUrl", label: "Webhook URL", type: "password" },
  ],
  whatsapp: [
    { key: "recipientPhone", label: "Recipient Phone" },
  ],
  "notion-daily-report": [
    { key: "notionApiKey", label: "Notion API Key", type: "password" },
  ],
  "google-drive-daily-csv": [
    { key: "googleClientEmail", label: "Service Account Email" },
    { key: "googlePrivateKey", label: "Private Key", type: "password" },
  ],
};

const SERVICE_LABELS: Record<ReusableSecretService, string> = {
  zerodha: "Zerodha",
  groww: "Groww",
  lighter: "Lighter",
  slack: "Slack",
  discord: "Discord",
  whatsapp: "WhatsApp",
  "notion-daily-report": "Notion",
  "google-drive-daily-csv": "Google Drive",
};

type ProfileSecretsTabProps = {
  secrets: ReusableSecretSummary[];
  setSecrets: React.Dispatch<React.SetStateAction<ReusableSecretSummary[]>>;
};

export function ProfileSecretsTab({ secrets, setSecrets }: ProfileSecretsTabProps) {
  const [selectedService, setSelectedService] = useState<ReusableSecretService>("zerodha");
  const [selectedSecretId, setSelectedSecretId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [payload, setPayload] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const fields = useMemo(() => SERVICE_FIELDS[selectedService], [selectedService]);
  const filteredSecrets = useMemo(
    () => secrets.filter((secret) => secret.service === selectedService),
    [secrets, selectedService],
  );

  useEffect(() => {
    if (!selectedSecretId) {
      setPayload({});
      return;
    }

    const load = async () => {
      const detail = await apiGetReusableSecret(selectedSecretId);
      setName(detail.name);
      setSelectedService(detail.service);
      setPayload(
        Object.fromEntries(
          Object.entries(detail.payload).map(([key, value]) => [key, String(value)]),
        ),
      );
    };

    void load();
  }, [selectedSecretId]);

  const resetForm = () => {
    setSelectedSecretId(null);
    setName("");
    setPayload({});
  };

  const refreshSecrets = async (service?: ReusableSecretService) => {
    const next = await apiGetReusableSecrets(service);
    setSecrets((current) => {
      const others = service ? current.filter((item) => item.service !== service) : [];
      return service ? [...others, ...next].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)) : next;
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const normalizedPayload = Object.fromEntries(
        fields
          .map((field) => [
            field.key,
            field.type === "number" ? Number(payload[field.key] || 0) : payload[field.key] || "",
          ])
          .filter(([, value]) => value !== "" && value !== undefined),
      );

      if (selectedSecretId) {
        await apiUpdateReusableSecret(selectedSecretId, {
          name,
          payload: normalizedPayload,
        });
        toast.success("Reusable secret updated");
      } else {
        await apiCreateReusableSecret({
          name,
          service: selectedService,
          payload: normalizedPayload,
        });
        toast.success("Reusable secret created");
      }
      await refreshSecrets(selectedService);
      resetForm();
    } catch (error: any) {
      toast.error("Unable to save secret", {
        description: error?.response?.data?.message || error?.message || "Please try again.",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (secretId: string) => {
    await apiDeleteReusableSecret(secretId);
    toast.success("Reusable secret deleted");
    await refreshSecrets(selectedService);
    if (selectedSecretId === secretId) resetForm();
  };

  return (
    <div className="space-y-8">
      <section className="space-y-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-sm font-semibold text-neutral-100">
              <KeyRound className="h-4 w-4 text-[#f17463]" />
              Reusable Secrets
            </div>
            <p className="mt-1 text-sm text-neutral-400">
              Save integration credentials once and reuse them across workflow nodes without embedding raw values everywhere.
            </p>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[340px_minmax(0,1fr)]">
          <div className="space-y-3 rounded-3xl border border-neutral-800 bg-black/35 p-4">
            <div className="text-xs uppercase tracking-[0.22em] text-neutral-500">Saved secrets</div>
            <div className="flex flex-wrap gap-2">
              {Object.entries(SERVICE_LABELS).map(([service, label]) => (
                <button
                  key={service}
                  type="button"
                  onClick={() => {
                    setSelectedService(service as ReusableSecretService);
                    resetForm();
                  }}
                  className={`rounded-full border px-3 py-1.5 text-xs transition ${
                    selectedService === service
                      ? "border-[#f17463]/45 bg-[#f17463]/12 text-[#f7b2a7]"
                      : "border-neutral-800 bg-neutral-950 text-neutral-400 hover:border-neutral-700 hover:text-neutral-200"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="space-y-2">
              {filteredSecrets.length ? filteredSecrets.map((secret) => (
                <button
                  key={secret.id}
                  type="button"
                  onClick={() => setSelectedSecretId(secret.id)}
                  className={`w-full rounded-2xl border px-4 py-3 text-left transition ${
                    selectedSecretId === secret.id
                      ? "border-[#f17463]/45 bg-[#f17463]/10"
                      : "border-neutral-800 bg-neutral-950/70 hover:border-neutral-700"
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="text-sm font-medium text-neutral-100">{secret.name}</div>
                      <div className="mt-1 text-xs text-neutral-500">
                        {secret.fieldKeys.join(" · ") || "No fields"}
                      </div>
                    </div>
                    <div className="text-[11px] text-neutral-500">
                      {new Date(secret.updatedAt).toLocaleDateString()}
                    </div>
                  </div>
                </button>
              )) : (
                <div className="rounded-2xl border border-dashed border-neutral-800 bg-neutral-950/50 px-4 py-6 text-sm text-neutral-500">
                  No saved {SERVICE_LABELS[selectedService].toLowerCase()} secrets yet.
                </div>
              )}
            </div>
          </div>

          <div className="space-y-5 rounded-3xl border border-neutral-800 bg-black/35 p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-sm font-semibold text-neutral-100">
                  {selectedSecretId ? "Edit secret" : "Create secret"}
                </div>
                <p className="mt-1 text-sm text-neutral-400">
                  Store only the values you want to reuse. Workflow-specific settings can stay on the node.
                </p>
              </div>
              {selectedSecretId ? (
                <Button
                  variant="ghost"
                  onClick={() => void handleDelete(selectedSecretId)}
                  className="cursor-pointer text-red-300 hover:bg-red-500/10 hover:text-red-200"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </Button>
              ) : null}
            </div>

            {!selectedSecretId ? (
              <div className="space-y-2">
                <label className="text-xs uppercase tracking-[0.18em] text-neutral-500">Service</label>
                <Select
                  value={selectedService}
                  onValueChange={(value) => setSelectedService(value as ReusableSecretService)}
                >
                  <SelectTrigger className="h-11 w-full rounded-2xl border-neutral-800 bg-neutral-950 px-4 text-sm text-white">
                    <SelectValue placeholder="Select a service" />
                  </SelectTrigger>
                  <SelectContent className="border-neutral-800 bg-neutral-950 text-white">
                    <SelectGroup>
                      {Object.entries(SERVICE_LABELS).map(([service, label]) => (
                        <SelectItem key={service} value={service}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
            ) : null}

            <div className="space-y-2">
              <label className="text-xs uppercase tracking-[0.18em] text-neutral-500">Secret name</label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-11 rounded-2xl border-neutral-800 bg-neutral-950 text-white"
                placeholder={`${SERVICE_LABELS[selectedService]} production`}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {fields.map((field) => (
                <div key={field.key} className="space-y-2">
                  <label className="text-xs uppercase tracking-[0.18em] text-neutral-500">{field.label}</label>
                  <Input
                    type={field.type === "password" ? "password" : field.type === "number" ? "number" : "text"}
                    value={payload[field.key] || ""}
                    onChange={(e) =>
                      setPayload((current) => ({
                        ...current,
                        [field.key]: e.target.value,
                      }))
                    }
                    className="h-11 rounded-2xl border-neutral-800 bg-neutral-950 text-white"
                  />
                </div>
              ))}
            </div>

            <Button
              onClick={() => void handleSave()}
              disabled={saving || !name.trim()}
              className="cursor-pointer rounded-2xl bg-[#f17463] px-5 text-sm font-light text-neutral-100 hover:bg-[#f48b7d]"
            >
              <Save className="mr-2 h-4 w-4" />
              {saving ? "Saving..." : selectedSecretId ? "Update secret" : "Save secret"}
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
