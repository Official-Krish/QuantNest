import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { AppBackground } from "@/components/background";
import {
  apiGetProfile,
  apiGetReusableSecrets,
  apiSaveProfile,
  apiUploadAvatar,
  clearAuthSession,
  setAvatarUrl as cacheAvatarUrl,
} from "@/http";
import { ProfileAccountTab } from "@/components/profile/ProfileAccountTab";
import { ProfileBillingTab } from "@/components/profile/ProfileBillingTab";
import { ProfileDangerTab } from "@/components/profile/ProfileDangerTab";
import { ProfileIntegrationsTab } from "@/components/profile/ProfileIntegrationsTab";
import { ProfileNotificationsTab } from "@/components/profile/ProfileNotificationsTab";
import { ProfileSecretsTab } from "@/components/profile/ProfileSecretsTab";
import { ProfileSidebar } from "@/components/profile/ProfileSidebar";
import { ProfileStatsGrid } from "@/components/profile/ProfileStatsGrid";
import type {
  BrokerPreference,
  IntegrationItem,
  MarketPreference,
  ProfileTab,
  ThemePreference,
} from "@/components/profile/types";

export default function Profile() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<ProfileTab>("account");
  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [avatarUrl, setAvatarPreviewUrl] = useState("");
  const [avatarFiles, setAvatarFiles] = useState<File[]>([]);
  const [defaultMarket, setDefaultMarket] = useState<MarketPreference>("Indian");
  const [defaultBroker, setDefaultBroker] = useState<BrokerPreference>("Zerodha");
  const [theme, setTheme] = useState<ThemePreference>("Dark");
  const [integrations, setIntegrations] = useState<IntegrationItem[]>([]);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [secrets, setSecrets] = useState<any[]>([]);
  const [billingPlan] = useState<"Starter" | "Pro" | "Team">("Pro");
  const [nextBillingDate] = useState("April 12, 2026");
  const [totalWorkflows, setTotalWorkflows] = useState(0);
  const [totalExecutions, setTotalExecutions] = useState(0);
  const [executionsThisMonth, setExecutionsThisMonth] = useState(0);
  const [executionQuota] = useState(500);
  const [memberSince, setMemberSince] = useState("Jan 2026");
  const [accountStatus, setAccountStatus] = useState("Active");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const [res, secretList] = await Promise.all([
          apiGetProfile(),
          apiGetReusableSecrets(),
        ]);
        setUsername(res.username);
        setDisplayName(res.displayName);
        setEmail(res.email);
        setAvatarPreviewUrl(res.avatarUrl || "");
        setDefaultMarket(res.preferences.defaultMarket);
        setDefaultBroker(res.preferences.defaultBroker);
        setTheme(res.preferences.theme);
        setNotificationsEnabled(res.notifications.workflowAlerts);
        setIntegrations(res.integrations);
        setTotalWorkflows(res.stats.totalWorkflows);
        setTotalExecutions(res.stats.totalExecutions);
        setExecutionsThisMonth(res.stats.executionsThisMonth);
        setMemberSince(res.memberSince);
        setAccountStatus(res.accountStatus);
        setSecrets(secretList);
      } catch {
        clearAuthSession();
        toast.warning("Session expired", {
          description: "Please sign in again to continue.",
        });
        navigate("/signin");
      }
    };

    void loadProfile();
  }, [navigate]);

  const connectedCount = useMemo(
    () => integrations.filter((integration) => integration.status === "connected").length,
    [integrations],
  );

  const usagePercent = Math.min(100, Math.round((executionsThisMonth / executionQuota) * 100));

  const handleSaveAccount = async () => {
    setSaving(true);
    try {
      let nextAvatarUrl = avatarUrl;
      if (avatarFiles[0]) {
        const file = avatarFiles[0];
        const upload = await apiUploadAvatar(file);
        nextAvatarUrl = upload.avatarUrl;
      }

      if (nextAvatarUrl) {
        setAvatarPreviewUrl(nextAvatarUrl);
        setAvatarFiles([]);
        cacheAvatarUrl(nextAvatarUrl);
      }

      const saved = await apiSaveProfile({
        displayName,
        preferences: {
          defaultMarket,
          defaultBroker,
          theme,
        },
        notifications: {
          workflowAlerts: notificationsEnabled,
        },
      });

      setDisplayName(saved.displayName);
      setDefaultMarket(saved.preferences.defaultMarket);
      setDefaultBroker(saved.preferences.defaultBroker);
      setTheme(saved.preferences.theme);
      setNotificationsEnabled(saved.notifications.workflowAlerts);

      toast.success("Profile updated", {
        description: "Your profile preferences were saved.",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSignout = () => {
    clearAuthSession();
    toast.success("Signed out");
    navigate("/signin");
  };

  return (
    <div className="relative isolate min-h-screen overflow-hidden bg-linear-to-b from-black via-neutral-950 to-black px-6 pb-10 pt-28 text-white">
      <AppBackground />

      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/")}
            className="cursor-pointer text-neutral-400 hover:bg-neutral-800 hover:text-white"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>

          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-[#f17463]">Profile</p>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight">Settings & Account</h1>
            <p className="mt-1 text-sm text-neutral-400">
              Manage your account, integrations, preferences, and billing from one place.
            </p>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
          <ProfileSidebar
            activeTab={activeTab}
            onSelectTab={setActiveTab}
            displayName={displayName}
            email={email}
            avatarUrl={avatarUrl}
            onAvatarChange={setAvatarFiles}
          />

          <main className="space-y-6">
            <div className="rounded-[28px] border border-neutral-800 bg-neutral-950/75 p-6 shadow-[0_30px_80px_rgba(0,0,0,0.28)] backdrop-blur-md">
              {activeTab === "account" ? (
                <ProfileAccountTab
                  displayName={displayName}
                  setDisplayName={setDisplayName}
                  username={username}
                  email={email}
                  saving={saving}
                  onSave={handleSaveAccount}
                  defaultMarket={defaultMarket}
                  setDefaultMarket={setDefaultMarket}
                  defaultBroker={defaultBroker}
                  setDefaultBroker={setDefaultBroker}
                  theme={theme}
                  setTheme={setTheme}
                />
              ) : null}

              {/* {activeTab === "integrations" ? (
                <ProfileIntegrationsTab integrations={integrations} />
              ) : null} */}

              {activeTab === "secrets" ? (
                <ProfileSecretsTab
                  secrets={secrets}
                  setSecrets={setSecrets}
                />
              ) : null}

              {activeTab === "billing" ? (
                <ProfileBillingTab
                  billingPlan={billingPlan}
                  nextBillingDate={nextBillingDate}
                  executionsThisMonth={executionsThisMonth}
                  executionQuota={executionQuota}
                  usagePercent={usagePercent}
                />
              ) : null}

              {activeTab === "notifications" ? (
                <ProfileNotificationsTab
                  notificationsEnabled={notificationsEnabled}
                  setNotificationsEnabled={setNotificationsEnabled}
                  saving={saving}
                  onSave={handleSaveAccount}
                />
              ) : null}

              {activeTab === "danger" ? <ProfileDangerTab onSignout={handleSignout} /> : null}
            </div>

            <ProfileStatsGrid
              totalWorkflows={totalWorkflows}
              totalExecutions={totalExecutions}
              memberSince={memberSince}
              accountStatus={accountStatus}
              connectedCount={connectedCount}
            />
          </main>
        </div>
      </div>
    </div>
  );
}
