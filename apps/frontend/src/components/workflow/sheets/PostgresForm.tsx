import { Input } from "@/components/ui/input";
import { ReliabilitySection } from "./ReliabilitySection";

interface PostgresFormProps {
  metadata: any;
  setMetadata: React.Dispatch<React.SetStateAction<any>>;
}

export const PostgresForm = ({ metadata, setMetadata }: PostgresFormProps) => {
  return (
    <div className="space-y-4 rounded-2xl border border-neutral-800 bg-neutral-950/70 p-3">
      <div className="space-y-2">
        <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-neutral-500">
          Connection String
        </p>
        <p className="text-xs text-neutral-400">
          PostgreSQL connection string (e.g., postgres://user:pass@localhost:5432/dbname)
        </p>
        <Input
          value={metadata.connectionString || ""}
          onChange={(e) =>
            setMetadata((current: any) => ({
              ...current,
              connectionString: e.target.value,
            }))
          }
          className="mt-1 border-neutral-800 bg-neutral-900 text-sm text-neutral-100"
          placeholder="postgres://user:password@host:5432/database"
        />
      </div>

      <div className="space-y-2">
        <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-neutral-500">
          Table Name
        </p>
        <p className="text-xs text-neutral-400">
          Target table for inserting workflow data
        </p>
        <Input
          type="text"
          value={metadata.tableName || ""}
          onChange={(e) =>
            setMetadata((current: any) => ({
              ...current,
              tableName: e.target.value,
            }))
          }
          className="mt-1 border-neutral-800 bg-neutral-900 text-sm text-neutral-100"
          placeholder="workflow_results"
        />
      </div>

      <div className="space-y-2">
        <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-neutral-500">
          JSON Payload (Optional)
        </p>
        <p className="text-xs text-neutral-400">
          Additional data to include with each row (will be merged with execution context)
        </p>
        <Input
          value={metadata.jsonPayload || ""}
          onChange={(e) =>
            setMetadata((current: any) => ({
              ...current,
              jsonPayload: e.target.value,
            }))
          }
          className="mt-1 border-neutral-800 bg-neutral-900 text-sm text-neutral-100"
          placeholder='{"custom_field": "value"}'
        />
      </div>

      <ReliabilitySection metadata={metadata} setMetadata={setMetadata} />
    </div>
  );
};
