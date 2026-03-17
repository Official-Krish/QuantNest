import { Handle, Position } from "@xyflow/react";

function PreviewShell({
  accent,
  label,
  badge,
  title,
  subtitle,
  sourceHandle,
  showTarget = true,
}: {
  accent: string;
  label: string;
  badge?: string;
  title: string;
  subtitle?: string;
  sourceHandle?: string;
  showTarget?: boolean;
}) {
  return (
    <div className="min-w-[150px] rounded-xl border border-neutral-700/80 bg-neutral-950/95 px-3 py-2 shadow-[0_0_0_1px_rgba(255,255,255,0.03)]">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[8px] font-semibold uppercase tracking-[0.18em]" style={{ color: accent }}>
          {label}
        </span>
        {badge ? (
          <span className="rounded-full bg-neutral-900 px-1.5 py-0.5 text-[8px] font-mono text-neutral-300">
            {badge}
          </span>
        ) : null}
      </div>
      <div className="mt-1 text-[11px] font-medium leading-4 text-neutral-100">{title}</div>
      {subtitle ? <div className="mt-1 text-[9px] leading-4 text-neutral-500">{subtitle}</div> : null}
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
      accent="#f17463"
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
      accent="#f17463"
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
    <div className="min-w-[160px] rounded-xl border border-neutral-700/80 bg-neutral-950/95 px-3 py-2 shadow-[0_0_0_1px_rgba(255,255,255,0.03)]">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[8px] font-semibold uppercase tracking-[0.18em] text-[#f17463]">Condition</span>
        <span className="rounded-full bg-neutral-900 px-1.5 py-0.5 text-[8px] font-mono text-neutral-300">{groups}G</span>
      </div>
      <div className="mt-1 text-[11px] font-medium leading-4 text-neutral-100">Branch workflow</div>
      <div className="mt-1 text-[9px] leading-4 text-neutral-500">True / false outputs</div>
      <Handle type="target" position={Position.Left} className="!h-2 !w-2 !border !border-neutral-900 !bg-neutral-300" />
      <Handle type="source" id="true" position={Position.Right} className="!h-2 !w-2 !border !border-neutral-900 !bg-emerald-400" style={{ top: "40%" }} />
      <Handle type="source" id="false" position={Position.Right} className="!h-2 !w-2 !border !border-neutral-900 !bg-rose-400" style={{ top: "68%" }} />
    </div>
  );
}

export function PreviewZerodha({ data }: any) {
  const { symbol = "Trade", qty = 0, type = "buy" } = data.metadata || {};
  return (
    <PreviewShell
      accent="#f17463"
      label="Zerodha"
      badge={String(type).toUpperCase()}
      title={`${qty} ${symbol}`}
      subtitle="Broker order"
    />
  );
}

export function PreviewGroww({ data }: any) {
  const { symbol = "Trade", qty = 0 } = data.metadata || {};
  return <PreviewShell accent="#f17463" label="Groww" title={`${qty} ${symbol}`} subtitle="Broker order" />;
}

export function PreviewLighter({ data }: any) {
  const { symbol = "Trade", qty = 0 } = data.metadata || {};
  return <PreviewShell accent="#f17463" label="Lighter" title={`${qty} ${symbol}`} subtitle="Broker order" />;
}

export function PreviewGmail({ data }: any) {
  const { recipientName = "User", recipientEmail = "No email" } = data.metadata || {};
  return <PreviewShell accent="#4285f4" label="Gmail" badge="EMAIL" title={recipientName} subtitle={recipientEmail} />;
}

export function PreviewDiscord({ data }: any) {
  const { channelName = "Discord" } = data.metadata || {};
  return <PreviewShell accent="#5865F2" label="Discord" badge="WEBHOOK" title={channelName} subtitle="Notification" />;
}

export function PreviewWhatsApp({ data }: any) {
  const { recipientPhone = "No phone" } = data.metadata || {};
  return <PreviewShell accent="#25D366" label="WhatsApp" badge="MSG" title="WhatsApp alert" subtitle={recipientPhone} />;
}

export function PreviewNotion({ data }: any) {
  const parentPageId = data.metadata?.parentPageId ? "Parent page set" : "Missing parent";
  return <PreviewShell accent="#22c55e" label="Notion" badge="REPORT" title="Daily report" subtitle={parentPageId} />;
}

export function PreviewGoogleDrive() {
  return <PreviewShell accent="#60a5fa" label="Drive" badge="CSV" title="Daily CSV export" subtitle="Reporting" />;
}

export const aiPreviewNodeTypes = {
  "price-trigger": PreviewPriceTrigger,
  timer: PreviewTimer,
  "conditional-trigger": PreviewConditional,
  zerodha: PreviewZerodha,
  groww: PreviewGroww,
  lighter: PreviewLighter,
  gmail: PreviewGmail,
  discord: PreviewDiscord,
  whatsapp: PreviewWhatsApp,
  "notion-daily-report": PreviewNotion,
  "google-drive-daily-csv": PreviewGoogleDrive,
};
