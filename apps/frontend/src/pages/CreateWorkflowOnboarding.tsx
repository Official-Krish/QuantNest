import React from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { AppBackground } from "@/components/background"
import { ChevronRight } from "lucide-react"

const onboardingSteps = [
  {
    title: "Add your triggers",
    detail: "Pick when your workflow runs — timers, price changes, or custom conditions.",
    label: "01",
  },
  {
    title: "Set up actions",
    detail: "Connect your broker, alerts, and reports. Keep it simple until you're ready to expand.",
    label: "02",
  },
  {
    title: "Improve with AI",
    detail: "Let AI learn your patterns and optimize your workflow over time.",
    label: "03",
  },
]

export const CreateWorkflowOnboarding = () => {
  const navigate = useNavigate()

  return (
    <div className="relative isolate flex min-h-screen w-full items-center justify-center overflow-hidden bg-black px-6 text-white">
      <AppBackground />
      <div className="mx-auto w-full max-w-4xl">
        <div className="rounded-3xl border border-white/10 bg-linear-to-b from-neutral-950 via-black to-neutral-950/80 p-6 md:p-8">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-[#f17463]">
            Create workflow
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-neutral-50 md:text-4xl">
            Let's set up your first workflow
          </h1>
          <p className="mt-4 max-w-2xl text-base text-neutral-300">
            Three simple steps to get your automation running.
          </p>

          <div className="mt-10 flex flex-col gap-6 md:gap-0 md:flex-row md:items-stretch md:justify-between">
            {onboardingSteps.map((step, idx) => (
              <React.Fragment key={step.label}>
                <div className="flex flex-col flex-1 min-h-[170px] rounded-2xl border border-white/10 bg-neutral-950/70 p-5">
                  <p className="text-[11px] font-semibold tracking-[0.18em] text-[#f17463]">
                    {step.label}
                  </p>
                  <h2 className="mt-3 text-base font-medium text-neutral-100">
                    {step.title}
                  </h2>
                  <p className="mt-2 flex-1 text-sm text-neutral-400">{step.detail}</p>
                </div>
                {idx < onboardingSteps.length - 1 && (
                  <>
                    <div className="flex justify-center md:hidden py-4">
                      <ChevronRight className="h-8 w-8 text-neutral-500 rotate-90" strokeWidth={1.5} />
                    </div>
                    <div className="hidden md:flex flex-shrink-0 px-2 self-center">
                      <ChevronRight className="h-8 w-8 text-neutral-500" strokeWidth={1.5} />
                    </div>
                  </>
                )}
              </React.Fragment>
            ))}
          </div>

          <div className="mt-16 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Button
              className="bg-[#f17463] text-neutral-100 hover:bg-[#f17463]/90 cursor-pointer font-medium"
              onClick={() => navigate("/create/ai-chat")}
            >
              Generate with AI
            </Button>
            <Button
              variant="outline"
              className="border-neutral-700 bg-neutral-900/50 text-neutral-200 hover:bg-neutral-900 hover:text-neutral-200 cursor-pointer"
              onClick={() => navigate("/create/builder")}
            >
              Continue to builder
            </Button>
            <button
              onClick={() => navigate("/dashboard")}
              className="ml-3 text-neutral-500 hover:text-neutral-300 hover:underline transition-colors text-sm font-medium cursor-pointer"
            >
              Back to dashboard
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
