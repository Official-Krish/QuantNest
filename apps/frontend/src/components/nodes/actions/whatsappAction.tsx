import { Handle, Position } from "@xyflow/react";
import { ServiceLogo } from "@/components/workflow/service-branding";

export const whatsappAction = ({
  data,
}: {
  data: {
    metadata: {
      recipientPhone?: string;
      recipientName?: string;
      secretId?: string;
    };
  };
}) => {
  const { recipientPhone, recipientName, secretId } = data.metadata || {};
  const hasSecret = Boolean(String(secretId || "").trim());
  const recipientDisplay = hasSecret
    ? "Recipient from stored secret"
    : recipientPhone || "No number set";

  return (
    <div className="min-w-57.5 rounded-2xl border border-neutral-700/80 border-l-[5px] border-l-[#25D366] bg-neutral-950/90 px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.03),0_0_0_1px_rgba(255,255,255,0.04)]">
      <div className="flex items-center justify-between gap-2">
        <span className="inline-flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#25D366]">
          <ServiceLogo service="whatsapp" size={14} />
          WhatsApp
        </span>
        <span className="rounded-full bg-neutral-900 px-2 py-0.5 text-[10px] font-mono text-neutral-300">
          MSG
        </span>
      </div>
      <div className="mt-2 text-sm font-medium text-neutral-100">
        {recipientName || "User"}
      </div>
      <div className="mt-1 text-[11px] text-neutral-400 truncate">
        {recipientDisplay}
      </div>
      <div className="mt-1 text-[11px] text-neutral-500">
        Sends WhatsApp notification on workflow events
      </div>
      <Handle
        type="target"
        position={Position.Left}
        className="h-2! w-2! bg-neutral-300! border border-neutral-900"
      />
      <Handle
        type="source"
        position={Position.Right}
        className="h-2! w-2! bg-[#25D366]! border border-neutral-900"
      />
    </div>
  );
};
