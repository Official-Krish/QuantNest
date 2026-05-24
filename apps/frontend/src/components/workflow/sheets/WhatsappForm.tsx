import { Lock } from "lucide-react";
import { ServiceLogo } from "@/components/workflow/service-branding";

export const WhatsappForm = () => {
  return (
    <div className="space-y-4 rounded-2xl border border-[#25D366]/30 border-l-4 border-l-[#25D366] bg-[#25D366]/5 p-4">
      <div className="flex items-center gap-3">
        <span className="inline-flex size-10 items-center justify-center rounded-xl border border-[#25D366]/25 bg-[#25D366]/10">
          <ServiceLogo service="whatsapp" size={20} />
        </span>
        <div>
          <p className="text-sm font-semibold text-neutral-100">WhatsApp</p>
          <p className="text-xs text-neutral-400">Coming soon</p>
        </div>
      </div>
      <div className="flex items-start gap-3 rounded-xl border border-neutral-800 bg-neutral-900/50 px-3 py-2.5">
        <Lock className="mt-0.5 size-4 shrink-0 text-[#25D366]" />
        <p className="text-xs leading-5 text-neutral-300">
          WhatsApp notifications are not yet available. You can use{" "}
          <span className="font-medium text-neutral-100">Telegram</span>,{" "}
          <span className="font-medium text-neutral-100">Discord</span>,{" "}
          <span className="font-medium text-neutral-100">Slack</span>, or{" "}
          <span className="font-medium text-neutral-100">Gmail</span> instead.
        </p>
      </div>
    </div>
  );
};