import { Handle, Position } from "@xyflow/react";

export const discordAction = ({
  data,
}: {
  data: {
    metadata: {
      webhookUrl?: string;
      recipientName?: string;
    };
  };
}) => {
  const { webhookUrl, recipientName } = data.metadata || {};

  return (
    <div className="min-w-[230px] rounded-2xl border border-neutral-700/80 bg-neutral-950/90 px-4 py-3 shadow-[0_0_0_1px_rgba(255,255,255,0.04)]">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#5865f2]">
          Discord
        </span>
        <span className="rounded-full bg-neutral-900 px-2 py-0.5 text-[10px] font-mono text-neutral-300">
          WEBHOOK
        </span>
      </div>
      <div className="mt-2 text-sm font-medium text-neutral-100">
        {recipientName || "User"}
      </div>
      <div className="mt-1 text-[11px] text-neutral-400 truncate">
        {webhookUrl ? "Webhook configured" : "No webhook set"}
      </div>
      <div className="mt-1 text-[11px] text-neutral-500">
        Sends Discord notification on workflow events
      </div>
      <Handle
        type="target"
        position={Position.Left}
        className="h-2! w-2! bg-neutral-300! border border-neutral-900"
      />
      <Handle
        type="source"
        position={Position.Right}
        className="h-2! w-2! bg-[#5865f2]! border border-neutral-900"
      />
    </div>
  );
};
