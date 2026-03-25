import { Handle, Position } from "@xyflow/react";

export const slackAction = ({
  data,
}: {
  data: {
    metadata: {
      slackUserId?: string;
      recipientName?: string;
    };
  };
}) => {
  const { slackUserId, recipientName } = data.metadata || {};

  return (
    <div className="min-w-[230px] rounded-2xl border border-neutral-700/80 bg-neutral-950/90 px-4 py-3 shadow-[0_0_0_1px_rgba(255,255,255,0.04)]">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#4A154B]">
          Slack
        </span>
        <span className="rounded-full bg-neutral-900 px-2 py-0.5 text-[10px] font-mono text-neutral-300">
          DM
        </span>
      </div>
      <div className="mt-2 text-sm font-medium text-neutral-100">
        {recipientName || "User"}
      </div>
      <div className="mt-1 truncate text-[11px] text-neutral-400">
        {slackUserId || "No Slack user selected"}
      </div>
      <div className="mt-1 text-[11px] text-neutral-500">
        Sends a Slack direct message on workflow events
      </div>
      <Handle
        type="target"
        position={Position.Left}
        className="h-2! w-2! bg-neutral-300! border border-neutral-900"
      />
      <Handle
        type="source"
        position={Position.Right}
        className="h-2! w-2! bg-[#4A154B]! border border-neutral-900"
      />
    </div>
  );
};
