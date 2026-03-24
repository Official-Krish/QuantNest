import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";

type ProfileDangerTabProps = {
  onSignout: () => void;
};

export function ProfileDangerTab({ onSignout }: ProfileDangerTabProps) {
  return (
    <div className="space-y-6">
      <div>
        <div className="text-lg font-semibold text-neutral-100">Danger Zone</div>
        <p className="mt-1 text-sm text-neutral-400">
          Sensitive actions that affect your account session and connected workflows.
        </p>
      </div>

      <div className="rounded-3xl border border-rose-500/30 bg-rose-500/8 p-5">
        <div className="text-sm font-semibold text-rose-200">Sign out from this device</div>
        <div className="mt-1 text-sm text-rose-100/80">
          End the current session and return to the sign-in screen.
        </div>
        <Button
          onClick={onSignout}
          className="mt-5 cursor-pointer rounded-2xl bg-rose-500 px-5 text-white hover:bg-rose-400"
        >
          <LogOut className="mr-2 h-4 w-4" />
          Sign out
        </Button>
      </div>
    </div>
  );
}
