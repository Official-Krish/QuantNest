import { Handle, Position } from "@xyflow/react";
import { ServiceLogo } from "@/components/workflow/service-branding";

function PreviewShell({
  accent,
  tone,
  kindBadge,
  label,
  badge,
  title,
  subtitle,
  iconService,
  sourceHandle,
  showTarget = true,
}: {
  accent: string;
  tone: "trigger" | "action";
  kindBadge: string;
  label: string;
  badge?: string;
  title: string;
  subtitle?: string;
  iconService?: string;
  sourceHandle?: string;
  showTarget?: boolean;
}) {
  return (
    <div
      className={`min-w-[160px] rounded-2xl border px-3.5 py-3 shadow-[0_0_0_1px_rgba(255,255,255,0.03)] ${
        tone === "trigger"
          ? "border-sky-500/35 bg-sky-500/8"
          : "border-[#f17463]/35 bg-[#f17463]/10"
      }`}
    >
      <div className="mb-2 flex items-center gap-2">
        <span
          className={`rounded-full px-2 py-0.5 text-[8px] font-semibold uppercase tracking-[0.18em] ${
            tone === "trigger" ? "bg-sky-500/14 text-sky-300" : "bg-[#f17463]/16 text-[#f59a8d]"
          }`}
        >
          {kindBadge}
        </span>
      </div>
      <div className="flex items-center justify-between gap-2">
        <span className="inline-flex items-center gap-1.5 text-[8px] font-semibold uppercase tracking-[0.18em]" style={{ color: accent }}>
          {iconService ? <ServiceLogo service={iconService} size={11} /> : null}
          {label}
        </span>
        {badge ? (
          <span className="rounded-full bg-black/50 px-1.5 py-0.5 text-[8px] font-mono text-neutral-200">
            {badge}
          </span>
        ) : null}
      </div>
      <div className="mt-1.5 text-[12px] font-semibold leading-4 text-neutral-100">{title}</div>
      {subtitle ? <div className="mt-1 text-[10px] leading-4 text-neutral-300/80">{subtitle}</div> : null}
      {showTarget ? (
        <Handle
          type="target"
          position={Position.Left}
          className="!h-2 !w-2 !border !border-neutral-900 !bg-neutral-300"
        />
      ) : null}
      <Handle
        type="source"
        position={Position.Right}
        id={sourceHandle}
        className="!h-2 !w-2 !border !border-neutral-900"
        style={{ backgroundColor: accent }}
      />
    </div>
  );
}

export function PreviewPriceTrigger({ data }: any) {
  const {
    asset = "-",
    mode = "threshold",
    condition = "above",
    targetPrice = 0,
    changeDirection = "increase",
    changeType = "percent",
    changeValue = 0,
    changeWindowMinutes = 60,
  } = data.metadata || {};
  const title = mode === "change"
    ? `${changeDirection} ${changeValue}${changeType === "percent" ? "%" : " pts"} in ${changeWindowMinutes}m`
    : `${condition} ${targetPrice}`;
  const subtitle = mode === "change"
    ? `Trigger on ${asset} momentum`
    : `Trigger on ${asset}`;
  return (
    <PreviewShell
      accent="#60a5fa"
      tone="trigger"
      kindBadge="Trigger"
      label="Price"
      badge={asset}
      title={title}
      subtitle={subtitle}
      showTarget={false}
    />
  );
}

export function PreviewTimer({ data }: any) {
  const { time = 1 } = data.metadata || {};
  return (
    <PreviewShell
      accent="#60a5fa"
      tone="trigger"
      kindBadge="Trigger"
      label="Timer"
      title={`Every ${time}h`}
      subtitle="Runs on schedule"
      showTarget={false}
    />
  );
}

export function PreviewConditional({ data }: any) {
  const groups = data.metadata?.groups?.length || 1;
  const expression = data.metadata?.expression;
  const firstGroup = expression?.conditions?.find((entry: any) => entry?.type === "group")
    || expression?.conditions?.[0];
  const firstClause = firstGroup?.type === "group"
    ? firstGroup.conditions?.find((entry: any) => entry?.type === "clause")
    : firstGroup?.type === "clause"
      ? firstGroup
      : null;

  const operatorLabel = (() => {
    const operator = String(firstClause?.operator || "").toLowerCase();
    if (operator === "crosses_above") return "crosses above";
    if (operator === "crosses_below") return "crosses below";
    return operator || "condition";
  })();

  const subtitle = firstClause
    ? `First clause: ${operatorLabel}`
    : "True / false outputs";

  return (
    <div className="min-w-[170px] rounded-2xl border border-sky-500/35 bg-sky-500/8 px-3.5 py-3 shadow-[0_0_0_1px_rgba(255,255,255,0.03)]">
      <div className="mb-2">
        <span className="rounded-full bg-sky-500/14 px-2 py-0.5 text-[8px] font-semibold uppercase tracking-[0.18em] text-sky-300">
          Trigger
        </span>
      </div>
      <div className="flex items-center justify-between gap-2">
        <span className="text-[8px] font-semibold uppercase tracking-[0.18em] text-sky-300">Condition</span>
        <span className="rounded-full bg-black/50 px-1.5 py-0.5 text-[8px] font-mono text-neutral-200">{groups}G</span>
      </div>
      <div className="mt-1.5 text-[12px] font-semibold leading-4 text-neutral-100">Branch workflow</div>
      <div className="mt-1 text-[10px] leading-4 text-neutral-300/80">{subtitle}</div>
      <Handle type="target" position={Position.Left} className="!h-2 !w-2 !border !border-neutral-900 !bg-neutral-300" />
      <Handle type="source" id="true" position={Position.Right} className="!h-2 !w-2 !border !border-neutral-900 !bg-emerald-400" style={{ top: "40%" }} />
      <Handle type="source" id="false" position={Position.Right} className="!h-2 !w-2 !border !border-neutral-900 !bg-rose-400" style={{ top: "68%" }} />
    </div>
  );
}

export function PreviewMarketSession({ data }: any) {
  const {
    marketType = "indian",
    event = "market-open",
    triggerTime,
  } = data.metadata || {};

  const marketLabel = String(marketType).toLowerCase() === "web3" ? "Crypto" : "Indian";
  const title = event === "market-close"
    ? "Market close"
    : event === "at-time"
      ? `At ${triggerTime || "--:--"}`
      : "Market open";

  const subtitle = event === "at-time"
    ? "Time-based session trigger"
    : "Session-based workflow trigger";

  return (
    <PreviewShell
      accent="#10b981"
      tone="trigger"
      kindBadge="Trigger"
      label="Market Session"
      badge={marketLabel}
      title={title}
      subtitle={subtitle}
      showTarget={false}
    />
  );
}

export function PreviewIf({ data }: any) {
  const groups = data.metadata?.expression?.conditions?.length || 1;
  return (
    <div className="min-w-[170px] rounded-2xl border border-[#f17463]/35 bg-[#f17463]/10 px-3.5 py-3 shadow-[0_0_0_1px_rgba(255,255,255,0.03)]">
      <div className="mb-2">
        <span className="rounded-full bg-[#f17463]/16 px-2 py-0.5 text-[8px] font-semibold uppercase tracking-[0.18em] text-[#f59a8d]">
          Action
        </span>
      </div>
      <div className="flex items-center justify-between gap-2">
        <span className="text-[8px] font-semibold uppercase tracking-[0.18em] text-[#f59a8d]">If</span>
        <span className="rounded-full bg-black/50 px-1.5 py-0.5 text-[8px] font-mono text-neutral-200">{groups}G</span>
      </div>
      <div className="mt-1.5 text-[12px] font-semibold leading-4 text-neutral-100">Branch downstream</div>
      <div className="mt-1 text-[10px] leading-4 text-neutral-300/80">True / false outputs</div>
      <Handle type="target" position={Position.Left} className="!h-2 !w-2 !border !border-neutral-900 !bg-neutral-300" />
      <Handle type="source" id="true" position={Position.Right} className="!h-2 !w-2 !border !border-neutral-900 !bg-emerald-400" style={{ top: "40%" }} />
      <Handle type="source" id="false" position={Position.Right} className="!h-2 !w-2 !border !border-neutral-900 !bg-rose-400" style={{ top: "68%" }} />
    </div>
  );
}

export function PreviewFilter({ data }: any) {
  const groups = data.metadata?.expression?.conditions?.length || 1;
  return (
    <PreviewShell
      accent="#14b8a6"
      tone="action"
      kindBadge="Action"
      label="Filter"
      badge={`${groups}G`}
      title="Gate downstream"
      subtitle="Continue only when condition passes"
    />
  );
}

export function PreviewDelay({ data }: any) {
  const seconds = Number(data.metadata?.durationSeconds || 0);
  return <PreviewShell accent="#f17463" tone="action" kindBadge="Action" label="Delay" badge="WAIT" title={`${seconds || 0}s pause`} subtitle="Wait before next step" />;
}

export function PreviewMerge() {
  return (
    <PreviewShell
      accent="#c084fc"
      tone="action"
      kindBadge="Action"
      label="Merge"
      badge="JOIN"
      title="Join branches"
      subtitle="Continue after parallel paths meet"
    />
  );
}

export function PreviewZerodha({ data }: any) {
  const { symbol = "Trade", qty = 0, type = "buy", secretId } = data.metadata || {};
  const hasSecret = Boolean(String(secretId || "").trim());
  return (
    <PreviewShell
      accent="#f17463"
      tone="action"
      kindBadge="Action"
      label="Zerodha"
      badge={String(type).toUpperCase()}
      title={`${qty} ${symbol}`}
      subtitle={hasSecret ? "Broker order · credentials from stored secret" : "Broker order"}
      iconService="zerodha"
    />
  );
}

export function PreviewGroww({ data }: any) {
  const { symbol = "Trade", qty = 0, secretId } = data.metadata || {};
  const hasSecret = Boolean(String(secretId || "").trim());
  return <PreviewShell accent="#34d399" tone="action" kindBadge="Action" label="Groww" title={`${qty} ${symbol}`} subtitle={hasSecret ? "Broker order · credentials from stored secret" : "Broker order"} iconService="groww" />;
}

export function PreviewLighter({ data }: any) {
  const { symbol = "Trade", qty = 0, secretId } = data.metadata || {};
  const hasSecret = Boolean(String(secretId || "").trim());
  return <PreviewShell accent="#fbbf24" tone="action" kindBadge="Action" label="Lighter" title={`${qty} ${symbol}`} subtitle={hasSecret ? "Broker order · credentials from stored secret" : "Broker order"} iconService="lighter" />;
}

export function PreviewGmail({ data }: any) {
  const { recipientName = "User", recipientEmail = "No email" } = data.metadata || {};
  return <PreviewShell accent="#ea4335" tone="action" kindBadge="Action" label="Gmail" badge="EMAIL" title={recipientName} subtitle={recipientEmail} iconService="gmail" />;
}

export function PreviewDiscord({ data }: any) {
  const { channelName = "Discord", secretId } = data.metadata || {};
  const hasSecret = Boolean(String(secretId || "").trim());
  const subtitle = hasSecret ? "Webhook from stored secret" : "Notification";
  return <PreviewShell accent="#8190ff" tone="action" kindBadge="Action" label="Discord" badge="WEBHOOK" title={channelName} subtitle={subtitle} iconService="discord" />;
}

export function PreviewSlack({ data }: any) {
  const { recipientName = "User", slackUserId, secretId } = data.metadata || {};
  const hasSecret = Boolean(String(secretId || "").trim());
  const subtitle = hasSecret ? "Recipient from stored secret" : slackUserId || "No Slack user";
  return <PreviewShell accent="#e87bc1" tone="action" kindBadge="Action" label="Slack" badge="DM" title={recipientName} subtitle={subtitle} iconService="slack" />;
}

export function PreviewTelegram({ data }: any) {
  const { recipientName = "User", telegramChatId, secretId } = data.metadata || {};
  const hasSecret = Boolean(String(secretId || "").trim());
  const subtitle = hasSecret ? "Recipient from stored secret" : telegramChatId || "No chat ID";
  return <PreviewShell accent="#229ED9" tone="action" kindBadge="Action" label="Telegram" badge="BOT" title={recipientName} subtitle={subtitle} iconService="telegram" />;
}

export function PreviewWhatsApp({ data }: any) {
  const { recipientPhone, secretId } = data.metadata || {};
  const hasSecret = Boolean(String(secretId || "").trim());
  const subtitle = hasSecret ? "Recipient from stored secret" : recipientPhone || "No phone";
  return <PreviewShell accent="#25D366" tone="action" kindBadge="Action" label="WhatsApp" badge="MSG" title="WhatsApp alert" subtitle={subtitle} iconService="whatsapp" />;
}

export function PreviewNotion({ data }: any) {
  const { parentPageId, secretId } = data.metadata || {};
  const hasSecret = Boolean(String(secretId || "").trim());
  const subtitle = hasSecret
    ? parentPageId
      ? "Parent page set · credentials from stored secret"
      : "Missing parent page · credentials from stored secret"
    : parentPageId
      ? "Parent page set"
      : "Missing parent";
  return <PreviewShell accent="#e5e7eb" tone="action" kindBadge="Action" label="Notion" badge="REPORT" title="Daily report" subtitle={subtitle} iconService="notion-daily-report" />;
}

export function PreviewGoogleDrive({ data }: any) {
  const { secretId } = data.metadata || {};
  const hasSecret = Boolean(String(secretId || "").trim());
  const subtitle = hasSecret ? "Reporting · credentials from stored secret" : "Reporting";
  return <PreviewShell accent="#8ab4f8" tone="action" kindBadge="Action" label="Drive" badge="CSV" title="Daily CSV export" subtitle={subtitle} iconService="google-drive-daily-csv" />;
}

export function PreviewGoogleSheets({ data }: any) {
  const { sheetName, sheetUrl } = data.metadata || {};
  const subtitle = sheetName
    ? `Tab: ${sheetName}`
    : sheetUrl
      ? "Sheet URL configured"
      : "Missing Sheet URL";
  return <PreviewShell accent="#34A853" tone="action" kindBadge="Action" label="Sheets" badge="REPORT" title="Execution report" subtitle={subtitle} iconService="google-sheets-report" />;
}

export const aiPreviewNodeTypes = {
  "price-trigger": PreviewPriceTrigger,
  timer: PreviewTimer,
  "conditional-trigger": PreviewConditional,
  "market-session": PreviewMarketSession,
  if: PreviewIf,
  filter: PreviewFilter,
  delay: PreviewDelay,
  merge: PreviewMerge,
  zerodha: PreviewZerodha,
  groww: PreviewGroww,
  lighter: PreviewLighter,
  gmail: PreviewGmail,
  slack: PreviewSlack,
  telegram: PreviewTelegram,
  discord: PreviewDiscord,
  whatsapp: PreviewWhatsApp,
  "notion-daily-report": PreviewNotion,
  "google-drive-daily-csv": PreviewGoogleDrive,
  "google-sheets-report": PreviewGoogleSheets,
};
