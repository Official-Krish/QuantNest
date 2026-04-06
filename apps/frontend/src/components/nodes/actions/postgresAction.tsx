import { Handle, Position } from "@xyflow/react";
import { ServiceLogo } from "@/components/workflow/service-branding";

export const postgresAction = ({
  data,
}: {
  data: {
    metadata: {
      connectionString?: string;
      tableName?: string;
    };
  };
}) => {
  const { connectionString, tableName } = data.metadata || {};

  // Extract host from connection string for display
  const displayHost = connectionString
    ? connectionString.replace(/^postgres:\/\//, "").split("/")[0].split("@")[1] || "db"
    : "Not configured";

  return (
    <div className="min-w-57.5 rounded-2xl border border-neutral-700/80 border-l-[5px] border-l-emerald-400 bg-neutral-950/90 px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.03),0_0_0_1px_rgba(255,255,255,0.04)]">
      <div className="flex items-center justify-between gap-2">
        <span className="inline-flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-400">
          <ServiceLogo service="postgres" size={14} />
          Postgres
        </span>
        <span className="rounded-full bg-neutral-900 px-2 py-0.5 text-[10px] font-mono text-neutral-300">
          DB
        </span>
      </div>
      <div className="mt-2 text-sm font-medium text-neutral-100">
        {tableName || "Table not set"}
      </div>
      <div className="mt-1 text-[11px] text-neutral-400 truncate">
        {displayHost}
      </div>
      <div className="mt-1 text-[11px] text-neutral-500">
        Insert workflow results into PostgreSQL
      </div>
      <Handle
        type="target"
        position={Position.Left}
        className="h-2! w-2! bg-neutral-300! border border-neutral-900"
      />
      <Handle
        type="source"
        position={Position.Right}
        className="h-2! w-2! bg-emerald-400! border border-neutral-900"
      />
    </div>
  );
};
