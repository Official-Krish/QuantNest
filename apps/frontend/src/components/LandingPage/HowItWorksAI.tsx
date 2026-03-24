import { ArrowRight } from "lucide-react"

const aiSteps = [
  {
    step: "01",
    type: "Describe",
    title: "Chat your strategy",
    description:
      "Tell AI exactly what you want: triggers, conditions, execution logic, and reporting in natural language.",
    badge: "Natural Language",
    tone: "text-[#f17463]",
  },
  {
    step: "02",
    type: "Refine",
    title: "Iterate and optimize",
    description:
      "AI generates the workflow; refine it through conversation until it matches your vision perfectly.",
    badge: "Multi-turn Chat",
    tone: "text-emerald-300",
  },
  {
    step: "03",
    type: "Add Credentials",
    title: "Connect your brokers",
    description:
      "Add broker credentials, API keys, and notification channels with secure vault storage.",
    badge: "Zerodha / Groww / Lighter",
    tone: "text-sky-300",
  },
  {
    step: "04",
    type: "Save",
    title: "Deploy and monitor",
    description:
      "Save the workflow to your dashboard and start executing with real-time monitoring and alerts.",
    badge: "Live Execution",
    tone: "text-purple-300",
  },
]

export const HowItWorksAI = () => {
  return (
    <section className="border-y border-neutral-800 bg-[radial-gradient(1200px_420px_at_20%_0%,rgba(241,116,99,0.12),transparent_60%),black]">
      <div className="mx-4 border-x border-neutral-800 px-6 py-14 md:mx-12 md:px-8 lg:mx-20 lg:px-10">
        <div className="mx-auto max-w-6xl">
          <div className="text-center">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-[#f17463]">
              AI Chat Builder
            </p>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight text-neutral-100 md:text-3xl">
              Go from idea to live workflow in minutes
            </h2>
          </div>

          <div className="mt-10 grid gap-5 md:grid-cols-4 md:gap-8">
            {aiSteps.map((item, index) => (
              <div key={item.step} className="relative">
                <article className="relative h-full min-h-55 rounded-2xl border border-neutral-800 bg-neutral-950/75 p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex h-7 w-7 items-center justify-center rounded-md border border-neutral-700 bg-neutral-900 text-[11px] font-semibold text-neutral-200">
                      {item.step}
                    </div>
                    <p className={`text-[10px] font-semibold uppercase tracking-[0.16em] ${item.tone}`}>
                      {item.type}
                    </p>
                  </div>

                  <h3 className="mt-3 text-sm font-semibold text-neutral-100">{item.title}</h3>
                  <p className="mt-2 text-xs leading-5 text-neutral-400">{item.description}</p>

                  <p className="mt-4 inline-flex rounded-full bg-neutral-900 px-2 py-0.5 text-[10px] font-mono text-neutral-300">
                    {item.badge}
                  </p>
                </article>

                {index < aiSteps.length - 1 && (
                  <div className="pointer-events-none absolute -right-6 top-1/2 z-10 hidden -translate-y-1/2 md:block">
                    <ArrowRight className="h-4 w-4 text-neutral-400" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
