const steps = [
  {
    step: "01",
    type: "Trigger",
    title: "Start with market intent",
    description:
      "Set a timer, price watch, or indicator condition to define when logic should run.",
    badge: "Timer / Price / Conditional",
    tone: "text-[#f17463]",
    accent: "border-l-[#f17463]",
    rail: "bg-[#f17463]",
    link: "bg-[#f17463]/60",
  },
  {
    step: "02",
    type: "Decision",
    title: "Evaluate trade context",
    description:
      "Branch true/false paths with indicator groups and optional AI reasoning checks.",
    badge: "RSI + EMA + Volume",
    tone: "text-emerald-300",
    accent: "border-l-emerald-400",
    rail: "bg-emerald-400",
    link: "bg-emerald-400/60",
  },
  {
    step: "03",
    type: "Action",
    title: "Execute and report",
    description:
      "Send broker orders, notify channels, and generate structured reporting outputs.",
    badge: "Zerodha / Gmail / Reporting",
    tone: "text-sky-300",
    accent: "border-l-sky-400",
    rail: "bg-sky-400",
    link: "bg-sky-400/60",
  },
]

export const HowItWorks = () => {
  return (
    <section className="border-y border-neutral-800 bg-black">
      <div className="mx-4 border-x border-neutral-800 px-6 py-14 md:mx-12 md:px-8 lg:mx-20 lg:px-10">
        <div className="mx-auto max-w-6xl">
          <div className="text-center">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-[#f17463]">
              How it works
            </p>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight text-neutral-100 md:text-3xl">
              Build, automate, and deploy with confidence
            </h2>
          </div>

          <div className="mt-10 grid gap-4 md:grid-cols-3 md:gap-6">
            {steps.map((item, index) => (
              <div key={item.step} className="relative">
                <div className={`h-full rounded-2xl border border-neutral-800 border-l-4 bg-neutral-950 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] ${item.accent}`}>
                  <div className="mb-4 flex items-center gap-2">
                    <span className={`h-1.5 w-1.5 rounded-full ${item.rail}`} />
                    <span className="text-[10px] font-mono text-neutral-500">node_{item.step}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <p className="text-[11px] font-semibold tracking-[0.18em] text-neutral-500">
                      STEP {item.step}
                    </p>
                    <span
                      className={`rounded-full px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] ${item.tone} bg-neutral-900/80`}
                    >
                      {item.type}
                    </span>
                  </div>
                  <div className="mt-4 rounded-xl border border-neutral-800 bg-black/80 px-3 py-3">
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-[10px] font-semibold uppercase tracking-[0.16em] ${item.tone}`}
                      >
                        {item.type} node
                      </span>
                      <span className="rounded-full bg-neutral-900 px-2 py-0.5 text-[10px] font-mono text-neutral-300">
                        {item.badge}
                      </span>
                    </div>
                    <p className="mt-2 text-sm font-medium text-neutral-100">
                      {item.title}
                    </p>
                    <p className="mt-1 text-xs text-neutral-400">
                      {item.description}
                    </p>
                  </div>
                </div>

                {index < steps.length - 1 && (
                  <>
                    <div className="pointer-events-none absolute -bottom-3 left-1/2 z-10 h-6 w-px -translate-x-1/2 md:hidden">
                      <div className={`h-full w-full ${item.link}`} />
                    </div>
                    <div className="pointer-events-none absolute -right-6 top-1/2 z-10 hidden h-px w-6 -translate-y-1/2 md:block">
                      <div className={`h-full w-full ${item.link}`} />
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
