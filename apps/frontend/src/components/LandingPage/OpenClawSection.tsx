import { Cpu, Puzzle, Shield } from "lucide-react";

const benefits = [
  {
    icon: Shield,
    title: "Zero-knowledge architecture",
    description:
      "Credentials are verified and encrypted on your machine. The cloud never sees your API keys, private keys, or tokens. Only verification status travels over the wire.",
    gradient: "from-[#f17463]/10 to-transparent",
  },
  {
    icon: Cpu,
    title: "Local AI execution",
    description:
      "AI decisions run on your hardware via OpenClaw's local gateway. No cloud AI latency, no data leakage, and full privacy for sensitive financial operations.",
    gradient: "from-emerald-500/10 to-transparent",
  },
  {
    icon: Puzzle,
    title: "Plugin ecosystem",
    description:
      "OpenClaw loads broker plugins — Zerodha, Groww, Jupiter, Lighter — directly on your machine. Add or remove capabilities without changing your workflows.",
    gradient: "from-sky-500/10 to-transparent",
  },
];

export const OpenClawSection = () => {
  return (
    <section className="border-y border-neutral-800 bg-[radial-gradient(1200px_420px_at_80%_100%,rgba(241,116,99,0.12),transparent_60%),black]">
      <div className="mx-4 border-x border-neutral-800 px-6 py-14 md:mx-12 md:px-8 lg:mx-20 lg:px-10">
        <div className="mx-auto max-w-6xl">
          <div className="text-center">
            <div className="group inline-flex items-center gap-3">
              <img
                src="/openclaw.png"
                alt="OpenClaw"
                className="h-8 w-8 rounded-md brightness-110 transition-all duration-500 group-hover:scale-110 group-hover:drop-shadow-[0_0_12px_rgba(241,116,99,0.6)] md:h-10 md:w-10"
              />
              <p className="text-xs font-medium uppercase tracking-[0.2em] text-[#f17463]">
                Local AI Execution
              </p>
            </div>
            <h2 className="mt-4 text-2xl font-semibold tracking-tight text-neutral-100 md:text-3xl">
              Your secrets stay yours
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-neutral-400">
              OpenClaw runs inside your machine, connecting QuantNest&apos;s
              cloud workflows to your local broker credentials without ever
              exposing them over the network.
            </p>
          </div>

          <div className="mt-10 grid gap-5 md:grid-cols-3 md:gap-6">
            {benefits.map((benefit) => (
              <article
                key={benefit.title}
                className="group relative overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-950/75 p-5 transition-all duration-300 hover:-translate-y-0.5 hover:border-neutral-700"
              >
                <div
                  className={`pointer-events-none absolute inset-0 bg-gradient-to-b ${benefit.gradient} opacity-0 transition-opacity duration-300 group-hover:opacity-100`}
                />
                <div className="relative z-10">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-neutral-700 bg-neutral-900">
                    <benefit.icon className="h-4 w-4 text-neutral-300" />
                  </div>
                  <h3 className="mt-4 text-sm font-semibold text-neutral-100">
                    {benefit.title}
                  </h3>
                  <p className="mt-2 text-xs leading-5 text-neutral-400">
                    {benefit.description}
                  </p>
                </div>
              </article>
            ))}
          </div>

          <div className="mt-12 rounded-xl border border-neutral-800 bg-neutral-950/50 p-5 md:p-6">
            <div className="flex flex-col items-center gap-3 text-center text-[11px] md:flex-row md:text-left">
              <div className="flex items-center gap-2 rounded-lg border border-neutral-800 bg-neutral-900/50 px-3 py-1.5 font-medium text-neutral-200">
                <span className="flex h-2 w-2 rounded-full bg-[#f17463] shadow-[0_0_6px_rgba(241,116,99,0.5)]" />
                QuantNest Cloud
              </div>
              <svg
                className="h-4 w-12 shrink-0 text-neutral-600"
                viewBox="0 0 48 16"
                fill="none"
              >
                <path
                  d="M0 8h40M40 2l6 6-6 6"
                  stroke="currentColor"
                  strokeWidth="1.5"
                />
              </svg>
              <div className="flex items-center gap-2 rounded-lg border border-neutral-800 bg-neutral-900/50 px-3 py-1.5 font-medium text-neutral-200">
                <span className="flex h-2 w-2 rounded-full bg-[#f17463]" />
                Agent
              </div>
              <svg
                className="h-4 w-12 shrink-0 text-neutral-600"
                viewBox="0 0 48 16"
                fill="none"
              >
                <path
                  d="M0 8h40M40 2l6 6-6 6"
                  stroke="currentColor"
                  strokeWidth="1.5"
                />
              </svg>
              <div className="flex items-center gap-2 rounded-lg border border-neutral-800 bg-neutral-900/50 px-3 py-1.5 font-medium text-neutral-200">
                <span className="flex h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.5)]" />
                OpenClaw Gateway
              </div>
              <svg
                className="h-4 w-12 shrink-0 text-neutral-600"
                viewBox="0 0 48 16"
                fill="none"
              >
                <path
                  d="M0 8h40M40 2l6 6-6 6"
                  stroke="currentColor"
                  strokeWidth="1.5"
                />
              </svg>
              <div className="flex items-center gap-2 rounded-lg border border-neutral-800 bg-neutral-900/50 px-3 py-1.5 font-medium text-neutral-200">
                <span className="flex h-2 w-2 rounded-full bg-sky-400 shadow-[0_0_6px_rgba(56,189,248,0.5)]" />
                Broker Plugins
              </div>
            </div>
            <p className="mt-4 text-center text-xs text-neutral-500">
              The QuantNest Agent runs on your machine, routing AI execution
              through your local OpenClaw gateway. Credentials never leave your
              environment.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
