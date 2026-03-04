import { hasAuthSession } from "@/http"
import {
  ArrowRight,
  Github,
  Info,
  ShieldCheck,
  Sparkles,
} from "lucide-react"
import { FaXTwitter } from "react-icons/fa6";

type FooterLink = {
  label: string
  href: string
}

const productLinks: FooterLink[] = [
  { label: "Workflow Builder", href: "/create/onboarding" },
  { label: "Execution Logs", href: "/dashboard" },
  { label: "Broker Integrations", href: "/create/onboarding" },
  { label: "Reporting", href: "/create/onboarding" },
]

const companyLinks: FooterLink[] = [
  { label: "About", href: "/about" },
  { label: "Docs", href: "/docs" },
  { label: "Changelog", href: "/changelog" },
  { label: "Contact", href: "/contact" },
]

const legalLinks: FooterLink[] = [
  { label: "Privacy", href: "/privacy-policy" },
  { label: "Terms", href: "/terms-of-service" },
  { label: "Cookie Policy", href: "/cookie-policy" },
]

const Footer = () => {
  return (
      <footer className="relative bg-black pt-10 text-white">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-[#f17463]/40 to-transparent" />
        <div className="w-full">
          <div className="rounded-2xl bg-linear-to-br from-neutral-950 via-black to-neutral-950/70 p-6 md:p-8">
          <div className="flex flex-col gap-6 pb-7 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.2em] text-[#f17463]">
                Final step
              </p>
              <h3 className="mt-2 text-xl font-semibold tracking-tight text-neutral-100 md:text-2xl">
                Ready to automate your strategy?
              </h3>
              <p className="mt-2 text-sm text-neutral-400">
                Build trigger-to-execution workflows with consent-aware AI reasoning.
              </p>
            </div>
            <button
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-white px-5 py-2.5 text-sm font-semibold text-neutral-900 transition hover:bg-neutral-200 cursor-pointer"
              onClick={() => {
                if (hasAuthSession()) {
                  window.location.href = "/create/onboarding"
                } else {
                  window.location.href = "/signup"
                }
              }}
            >
              Start Building
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>

          <div className="grid gap-8 border-b border-neutral-800 py-7 md:grid-cols-[1.4fr_1fr_1fr_1.2fr]">
            <div>
              <div className="flex items-center gap-2">
                <img src="/Logo.png" width={28} height={28} alt="QuantNest logo" />
                <p className="text-lg font-semibold text-neutral-100">QuantNest</p>
              </div>
              <p className="mt-3 max-w-sm text-sm text-neutral-400">
                Visual trading automation for teams that need speed, control, and traceability.
              </p>
              <div className="mt-4 flex items-center gap-1 text-xs text-neutral-200">
                <span>Crafted with</span>
                <span className="text-[#f17463]">❤️</span>
                <span>by Krish Anand</span>
              </div>
            </div>

            <FooterColumn title="Product" links={productLinks} />
            <FooterColumn title="Company" links={companyLinks} />
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-500">
                Trust & transparency
              </p>
              <div className="mt-3 space-y-3 text-xs text-neutral-400">
                <div className="flex items-start gap-2">
                  <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-300" />
                  <p>Data encrypted in transit. Broker credentials are isolated from AI payloads.</p>
                </div>
                <div className="flex items-start gap-2">
                  <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-sky-300" />
                  <p>AI analysis runs only for opted-in workflows and user-approved reporting actions.</p>
                </div>
                <div className="flex items-start gap-2">
                  <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#f17463]" />
                  <p>You can revoke data-sharing consent anytime from workflow action settings.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-4 pt-6 text-xs text-neutral-500 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-wrap items-center gap-4">
              {legalLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  className="transition-colors hover:text-neutral-300"
                >
                  {link.label}
                </a>
              ))}
              <span className="text-neutral-700">|</span>
              <span>© 2026 QuantNest. All rights reserved.</span>
            </div>

            <div className="flex items-center gap-3">
              <a
                href="https://x.com"
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-md border border-neutral-800 bg-neutral-950 p-2 text-neutral-400 transition-colors hover:text-white"
                aria-label="X"
              >
                <FaXTwitter className="h-4 w-4" />
              </a>
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-md border border-neutral-800 bg-neutral-950 p-2 text-neutral-400 transition-colors hover:text-white"
                aria-label="GitHub"
              >
                <Github className="h-4 w-4" />
              </a>
            </div>
          </div>
          </div>
        </div>
      </footer>
  )
}

const FooterColumn = ({
  title,
  links,
}: {
  title: string
  links: FooterLink[]
}) => (
  <div>
    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-500">
      {title}
    </p>
    <ul className="mt-3 space-y-2">
      {links.map((link) => (
        <li key={link.label}>
          <a
            href={link.href}
            className="text-sm text-neutral-300 transition-colors hover:text-white"
          >
            {link.label}
          </a>
        </li>
      ))}
    </ul>
  </div>
)

export default Footer
