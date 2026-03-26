import { Handle, Position } from "@xyflow/react";

function PreviewShell({
  accent,
  tone,
  kindBadge,
  label,
  badge,
  title,
  subtitle,
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
        <span className="text-[8px] font-semibold uppercase tracking-[0.18em]" style={{ color: accent }}>
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
  const { asset = "-", condition = "above", targetPrice = 0 } = data.metadata || {};
  return (
    <PreviewShell
      accent="#60a5fa"
      tone="trigger"
      kindBadge="Trigger"
      label="Price"
      badge={asset}
      title={`${condition} ${targetPrice}`}
      subtitle={`Trigger on ${asset}`}
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
      <div className="mt-1 text-[10px] leading-4 text-neutral-300/80">True / false outputs</div>
      <Handle type="target" position={Position.Left} className="!h-2 !w-2 !border !border-neutral-900 !bg-neutral-300" />
      <Handle type="source" id="true" position={Position.Right} className="!h-2 !w-2 !border !border-neutral-900 !bg-emerald-400" style={{ top: "40%" }} />
      <Handle type="source" id="false" position={Position.Right} className="!h-2 !w-2 !border !border-neutral-900 !bg-rose-400" style={{ top: "68%" }} />
    </div>
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

export function PreviewDelay({ data }: any) {
  const seconds = Number(data.metadata?.durationSeconds || 0);
  return <PreviewShell accent="#f17463" tone="action" kindBadge="Action" label="Delay" badge="WAIT" title={`${seconds || 0}s pause`} subtitle="Wait before next step" />;
}

export function PreviewZerodha({ data }: any) {
  const { symbol = "Trade", qty = 0, type = "buy" } = data.metadata || {};
  return (
    <PreviewShell
      accent="#f17463"
      tone="action"
      kindBadge="Action"
      label="Zerodha"
      badge={String(type).toUpperCase()}
      title={`${qty} ${symbol}`}
      subtitle="Broker order"
    />
  );
}

export function PreviewGroww({ data }: any) {
  const { symbol = "Trade", qty = 0 } = data.metadata || {};
  return <PreviewShell accent="#f17463" tone="action" kindBadge="Action" label="Groww" title={`${qty} ${symbol}`} subtitle="Broker order" />;
}

export function PreviewLighter({ data }: any) {
  const { symbol = "Trade", qty = 0 } = data.metadata || {};
  return <PreviewShell accent="#f17463" tone="action" kindBadge="Action" label="Lighter" title={`${qty} ${symbol}`} subtitle="Broker order" />;
}

export function PreviewGmail({ data }: any) {
  const { recipientName = "User", recipientEmail = "No email" } = data.metadata || {};
  return <PreviewShell accent="#f17463" tone="action" kindBadge="Action" label="Gmail" badge="EMAIL" title={recipientName} subtitle={recipientEmail} />;
}

export function PreviewDiscord({ data }: any) {
  const { channelName = "Discord" } = data.metadata || {};
  return <PreviewShell accent="#f17463" tone="action" kindBadge="Action" label="Discord" badge="WEBHOOK" title={channelName} subtitle="Notification" />;
}

export function PreviewWhatsApp({ data }: any) {
  const { recipientPhone = "No phone" } = data.metadata || {};
  return <PreviewShell accent="#f17463" tone="action" kindBadge="Action" label="WhatsApp" badge="MSG" title="WhatsApp alert" subtitle={recipientPhone} />;
}

export function PreviewNotion({ data }: any) {
  const parentPageId = data.metadata?.parentPageId ? "Parent page set" : "Missing parent";
  return <PreviewShell accent="#f17463" tone="action" kindBadge="Action" label="Notion" badge="REPORT" title="Daily report" subtitle={parentPageId} />;
}

export function PreviewGoogleDrive() {
  return <PreviewShell accent="#f17463" tone="action" kindBadge="Action" label="Drive" badge="CSV" title="Daily CSV export" subtitle="Reporting" />;
}

export const aiPreviewNodeTypes = {
  "price-trigger": PreviewPriceTrigger,
  timer: PreviewTimer,
  "conditional-trigger": PreviewConditional,
  if: PreviewIf,
  delay: PreviewDelay,
  zerodha: PreviewZerodha,
  groww: PreviewGroww,
  lighter: PreviewLighter,
  gmail: PreviewGmail,
  discord: PreviewDiscord,
  whatsapp: PreviewWhatsApp,
  "notion-daily-report": PreviewNotion,
  "google-drive-daily-csv": PreviewGoogleDrive,
};
