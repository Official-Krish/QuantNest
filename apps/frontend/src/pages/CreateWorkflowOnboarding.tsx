import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"

const onboardingSteps = [
  {
    title: "Define trigger cadence",
    detail:
      "Start with timer, price, or conditional triggers to decide when execution should run.",
    label: "01",
  },
  {
    title: "Attach execution and reporting actions",
    detail:
      "Connect broker, notification, and reporting nodes. Keep each branch explicit and testable.",
    label: "02",
  },
  {
    title: "Enable AI reasoning with consent",
    detail:
      "Opt in where needed and include enough indicator or trade context for useful summaries.",
    label: "03",
  },
]

export const CreateWorkflowOnboarding = () => {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen w-full bg-black px-6 pb-10 pt-24 text-white md:px-10">
      <div className="mx-auto max-w-5xl">
        <div className="rounded-3xl border border-neutral-800 bg-linear-to-b from-neutral-950 via-black to-neutral-950/80 p-6 md:p-8">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-[#f17463]">
            Create workflow
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-neutral-50 md:text-4xl">
            Quick onboarding before you open the builder
          </h1>
          <p className="mt-3 max-w-2xl text-sm text-neutral-400">
            This path keeps setup consistent so generated workflows are production-safe from day one.
          </p>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {onboardingSteps.map((step) => (
              <div
                key={step.label}
                className="rounded-2xl border border-neutral-800 bg-neutral-950/70 p-4"
              >
                <p className="text-[11px] font-semibold tracking-[0.18em] text-[#f17463]">
                  {step.label}
                </p>
                <h2 className="mt-2 text-base font-medium text-neutral-100">
                  {step.title}
                </h2>
                <p className="mt-2 text-xs text-neutral-400">{step.detail}</p>
              </div>
            ))}
          </div>

          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <Button
              className="bg-white text-neutral-900 hover:bg-neutral-200 cursor-pointer"
              onClick={() => navigate("/create/builder")}
            >
              Continue to builder
            </Button>
            <Button
              variant="outline"
              className="border-[#f17463]/40 bg-[#f17463]/10 text-[#f17463] hover:bg-[#f17463]/15 hover:text-[#f17463] cursor-pointer"
              onClick={() => navigate("/create/ai-chat")}
            >
              Generate with AI
            </Button>
            <Button
              variant="outline"
              className="border-neutral-700 bg-neutral-900/50 text-neutral-200 hover:bg-neutral-900 hover:text-neutral-200 cursor-pointer"
              onClick={() => navigate("/dashboard")}
            >
              Back to dashboard
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
