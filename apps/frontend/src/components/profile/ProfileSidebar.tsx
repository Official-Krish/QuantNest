import type { ComponentType } from "react";
import {
  Bell,
  CreditCard,
  PlugZap,
  ShieldAlert,
  UserRound,
} from "lucide-react";
import { FileUpload } from "@/components/ui/file-upload";
import type { ProfileTab } from "./types";

type ProfileSidebarProps = {
  activeTab: ProfileTab;
  onSelectTab: (tab: ProfileTab) => void;
  displayName: string;
  email: string;
  avatarUrl: string;
  onAvatarChange: (files: File[]) => void;
};

const tabs: Array<{
  key: ProfileTab;
  label: string;
  icon: ComponentType<{ className?: string }>;
}> = [
  { key: "account", label: "Account", icon: UserRound },
//   { key: "integrations", label: "Integrations", icon: PlugZap },
  { key: "billing", label: "Billing", icon: CreditCard },
  { key: "notifications", label: "Notifications", icon: Bell },
  { key: "danger", label: "Danger Zone", icon: ShieldAlert },
];

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function ProfileSidebar({
  activeTab,
  onSelectTab,
  displayName,
  email,
  avatarUrl,
  onAvatarChange,
}: ProfileSidebarProps) {
  return (
    <aside className="lg:sticky lg:top-28 lg:self-start">
      <div className="rounded-[28px] border border-neutral-800 bg-neutral-950/80 p-5 shadow-[0_30px_80px_rgba(0,0,0,0.35)] backdrop-blur-md">
        <FileUpload
          variant="avatar"
          initialPreview={avatarUrl}
          onChange={onAvatarChange}
          username={displayName || "User"}
          className="mb-4"
        />

        <div className="text-center">
          <div className="text-lg font-semibold text-neutral-100">{displayName}</div>
          <div className="mt-1 text-sm text-neutral-400">{email}</div>
        </div>

        <div className="mt-6 space-y-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => onSelectTab(tab.key)}
                className={cx(
                  "flex w-full cursor-pointer items-center gap-3 rounded-2xl border px-3.5 py-3 text-left transition",
                  active
                    ? "border-[#f17463]/45 bg-[#f17463]/10 text-white"
                    : "border-neutral-800 bg-black/40 text-neutral-400 hover:border-neutral-700 hover:text-neutral-200",
                )}
              >
                <Icon className={cx("h-4 w-4", active ? "text-[#f17463]" : "text-neutral-500")} />
                <span className="text-sm font-medium">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </aside>
  );
}
