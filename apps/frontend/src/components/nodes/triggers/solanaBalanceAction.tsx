import { Handle, Position } from "@xyflow/react";

export const solanaBalanceAction = ({
  data,
}: {
  data: {
    metadata: {
      walletAddress?: string;
      condition?: string;
      threshold?: number;
    };
  };
}) => {
  const { walletAddress, condition, threshold } = data.metadata || {};

  return (
    <div className="min-w-57.5 rounded-2xl border border-neutral-700/80 border-l-[5px] border-l-[#99f6e4] bg-neutral-950/90 px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.03),0_0_0_1px_rgba(255,255,255,0.04)]">
      <div className="flex items-center justify-between gap-2">
        <span className="inline-flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#99f6e4]">
          Solana Balance
        </span>
        <span className="rounded-full bg-neutral-900 px-2 py-0.5 text-[10px] font-mono text-neutral-300">
          BAL
        </span>
      </div>
      <div className="mt-2 text-sm font-medium text-neutral-100">
        {condition && threshold
          ? `${condition} ${threshold} SOL`
          : "Balance trigger not configured"}
      </div>
      <div className="mt-1 text-[11px] text-neutral-400 truncate">
        {walletAddress
          ? `${walletAddress.slice(0, 8)}...${walletAddress.slice(-4)}`
          : "No wallet set"}
      </div>
      <div className="mt-1 text-[11px] text-neutral-500">
        Trigger on Solana wallet balance
      </div>
      <Handle
        type="source"
        position={Position.Right}
        className="h-2! w-2! bg-[#99f6e4]! border border-neutral-900"
      />
    </div>
  );
};
