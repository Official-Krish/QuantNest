import { Lock, Mail, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { BrokerPreference, MarketPreference, ThemePreference } from "./types";

type ProfileAccountTabProps = {
  displayName: string;
  setDisplayName: (value: string) => void;
  username: string;
  email: string;
  saving: boolean;
  onSave: () => void;
  defaultMarket: MarketPreference;
  setDefaultMarket: (value: MarketPreference) => void;
  defaultBroker: BrokerPreference;
  setDefaultBroker: (value: BrokerPreference) => void;
  theme: ThemePreference;
  setTheme: (value: ThemePreference) => void;
};

const brokerOptions: BrokerPreference[] = ["Zerodha", "Groww", "Lighter", "Paper Trading"];

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function ProfileAccountTab({
  displayName,
  setDisplayName,
  username,
  email,
  saving,
  onSave,
  defaultMarket,
  setDefaultMarket,
  defaultBroker,
  setDefaultBroker,
  theme,
  setTheme,
}: ProfileAccountTabProps) {
  return (
    <div className="space-y-8">
      <section className="space-y-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-sm font-semibold text-neutral-100">
              Personal Info
            </div>
            <p className="mt-1 text-sm text-neutral-400">
              Update the primary details shown across your workspace.
            </p>
          </div>

          <Button
            onClick={onSave}
            disabled={saving}
            className="cursor-pointer rounded-2xl bg-[#f17463] px-5 text-sm font-light text-neutral-100 hover:bg-[#f48b7d]"
          >
            <Save className="mr-2 h-4 w-4" />
            {saving ? "Saving..." : "Save"}
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label className="text-neutral-300">Display Name</Label>
            <Input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="h-12 rounded-2xl border-neutral-800 bg-black/60 text-white focus-visible:ring-[#f17463]"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-neutral-300">Username</Label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500" />
              <Input
                value={username}
                readOnly
                className="h-12 rounded-2xl border-neutral-800 bg-neutral-900/60 pl-11 pr-11 text-neutral-300"
              />
              <Lock className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500" />
            </div>
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label className="text-neutral-300">Email</Label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500" />
              <Input
                value={email}
                readOnly
                className="h-12 rounded-2xl border-neutral-800 bg-neutral-900/60 pl-11 pr-11 text-neutral-300"
              />
              <Lock className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500" />
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-5 border-t border-neutral-800 pt-8">
        <div>
          <div className="text-sm font-semibold text-neutral-100">Preferences</div>
          <p className="mt-1 text-sm text-neutral-400">
            Set defaults so new workflows start with the right context.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <div className="space-y-3">
            <Label className="text-neutral-300">Default Market</Label>
            <div className="flex flex-wrap gap-2">
              {(["Indian", "US", "Crypto"] as MarketPreference[]).map((market) => (
                <button
                  key={market}
                  type="button"
                  onClick={() => setDefaultMarket(market)}
                  className={cx(
                    "rounded-full border px-4 py-2 text-sm transition",
                    defaultMarket === market
                      ? "border-[#f17463]/45 bg-[#f17463]/12 text-[#f7b2a7]"
                      : "border-neutral-800 bg-black/40 text-neutral-400 hover:border-neutral-700 hover:text-neutral-200",
                  )}
                >
                  {market}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <Label className="text-neutral-300">Default Broker</Label>
            <select
              value={defaultBroker}
              onChange={(e) => setDefaultBroker(e.target.value as BrokerPreference)}
              className="h-12 w-full rounded-2xl border border-neutral-800 bg-black/60 px-4 text-sm text-white outline-none"
            >
              {brokerOptions.map((broker) => (
                <option key={broker} value={broker}>
                  {broker}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-3 md:col-span-2">
            <Label className="text-neutral-300">Theme</Label>
            <div className="flex flex-wrap gap-2">
              {(["Dark", "Light"] as ThemePreference[]).map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setTheme(option)}
                  className={cx(
                    "rounded-full border px-4 py-2 text-sm transition",
                    theme === option
                      ? "border-[#f17463]/45 bg-[#f17463]/12 text-[#f7b2a7]"
                      : "border-neutral-800 bg-black/40 text-neutral-400 hover:border-neutral-700 hover:text-neutral-200",
                  )}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
