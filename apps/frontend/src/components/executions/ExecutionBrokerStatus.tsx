import { WorkflowStatusBadge } from "../dashboard/WorkflowStatusBadge";

interface ExecutionBrokerStatusProps {
  hasZerodha: boolean;
  tokenStatus: any;
  marketStatus: any;
}

export const ExecutionBrokerStatus = ({
  hasZerodha,
  tokenStatus,
  marketStatus,
}: ExecutionBrokerStatusProps) => {
  if (!hasZerodha) return null;

  return (
    <section className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-neutral-800 bg-neutral-900/50 px-4 py-3">
      <WorkflowStatusBadge
        hasZerodha={hasZerodha}
        tokenStatus={tokenStatus}
        marketStatus={marketStatus}
      />
      {marketStatus?.nextOpenTime && !marketStatus?.isOpen && (
        <p className="text-xs text-neutral-400">Next market open: {marketStatus.nextOpenTime}</p>
      )}
    </section>
  );
};
