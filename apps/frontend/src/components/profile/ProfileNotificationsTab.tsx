import { Save } from "lucide-react";
import { Button } from "@/components/ui/button";

type ProfileNotificationsTabProps = {
  notificationsEnabled: boolean;
  setNotificationsEnabled: (updater: (current: boolean) => boolean) => void;
  saving: boolean;
  onSave: () => void;
};

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function ProfileNotificationsTab({
  notificationsEnabled,
  setNotificationsEnabled,
  saving,
  onSave,
}: ProfileNotificationsTabProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-lg font-semibold text-neutral-100">Notifications</div>
          <p className="mt-1 text-sm text-neutral-400">
            Control how account and workflow updates reach you.
          </p>
        </div>

        <Button
          onClick={onSave}
          disabled={saving}
          className="cursor-pointer rounded-2xl bg-[#f17463] px-5 text-sm font-light text-neutral-100 hover:bg-[#f48b7d]"
        >
          <Save className="mr-2 h-4 w-4" />
          {saving ? "Saving..." : "Save"}
        </Button>
      </div>
      <div className="rounded-3xl border border-neutral-800 bg-black/40 p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-sm font-semibold text-neutral-100">Workflow alerts</div>
            <div className="mt-1 text-sm text-neutral-400">
              Receive updates when executions run, fail, or need attention.
            </div>
          </div>
          <button
            type="button"
            onClick={() => setNotificationsEnabled((current) => !current)}
            className={cx(
              "relative h-7 w-14 rounded-full transition",
              notificationsEnabled ? "bg-[#f17463]" : "bg-neutral-800",
            )}
          >
            <span
              className={cx(
                "absolute top-1 h-5 w-5 rounded-full bg-white transition",
                notificationsEnabled ? "left-8" : "left-1",
              )}
            />
          </button>
        </div>
      </div>
    </div>
  );
}
