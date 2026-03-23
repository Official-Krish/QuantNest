import { AppBackground } from "@/components/background";
import { hasAuthSession } from "@/http";
import {
  ArrowRight,
  CalendarClock,
  CheckCircle2,
  ChevronRight,
  CircleHelp,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { PricingPlans, type PricingPlan } from "@/components/pricing/PricingPlans";

type PageSection = {
  title: string;
  body: string;
  checklist: string[];
};

type PageFaq = {
  question: string;
  answer: string;
};

type StaticPageConfig = {
  label: string;
  title: string;
  subtitle: string;
  lastUpdated: string;
  highlights: Array<{ label: string; value: string }>;
  sections: PageSection[];
  faqs: PageFaq[];
  pricingPlans?: PricingPlan[];
};

const PAGE_CONFIG: Record<string, StaticPageConfig> = {
  pricing: {
    label: "Pricing",
    title: "Transparent pricing built for strategy operators",
    subtitle:
      "Plans are designed around active workflows, execution volume, and team-level controls so growth does not require migration pain.",
    lastUpdated: "March 2026",
    highlights: [
      { label: "Plan model", value: "Usage + capability tiers" },
      { label: "Target users", value: "Solo, Pro, Team desks" },
      { label: "Billing", value: "Monthly and annual options" },
    ],
    sections: [
      {
        title: "Plan architecture",
        body: "QuantNest pricing separates core platform access from high-throughput execution and advanced reporting needs. This keeps entry cost low while preserving predictable scaling.",
        checklist: [
          "Starter for early strategy validation",
          "Pro for high-frequency workflow iteration",
          "Team for governance and shared operations",
        ],
      },
      {
        title: "Included capabilities",
        body: "Each tier includes visual workflow builder, execution history, and core action integrations. Higher tiers unlock larger limits and priority support handling.",
        checklist: [
          "Workflow creation and version updates",
          "Broker, notification, and reporting actions",
          "Operational visibility with execution traces",
        ],
      },
      {
        title: "Commercial policy",
        body: "Annual plans provide pricing efficiency and better support SLAs. Enterprise agreements can include dedicated onboarding and deployment review.",
        checklist: [
          "Predictable spend under growth",
          "SLA-aligned support paths",
          "Enterprise contract compatibility",
        ],
      },
    ],
    faqs: [
      {
        question: "Will existing users be grandfathered when plans go live?",
        answer: "Yes. Existing users will receive a protected transition window with clear upgrade paths before new limits are enforced.",
      },
      {
        question: "Can plan limits be increased without changing tier?",
        answer: "For select workloads, add-on packs will be available so you can extend usage before full-tier migration.",
      },
    ],
    pricingPlans: [
      {
        name: "Starter",
        monthlyPrice: "$19",
        annualPrice: "$190",
        description: "For solo traders validating workflow ideas.",
        workflows: "Up to 10",
        executionsPerDay: "2,000",
        support: "Community + Email",
        reporting: "Basic reports",
      },
      {
        name: "Pro",
        monthlyPrice: "$79",
        annualPrice: "$790",
        description: "For active operators running multiple live strategies.",
        workflows: "Up to 50",
        executionsPerDay: "25,000",
        support: "Priority Email",
        reporting: "Advanced AI reports",
        recommended: true,
      },
      {
        name: "Team",
        monthlyPrice: "$249",
        annualPrice: "$2,490",
        description: "For desks with shared ownership and governance.",
        workflows: "Unlimited",
        executionsPerDay: "150,000+",
        support: "Dedicated Slack + SLA",
        reporting: "Team analytics + exports",
      },
    ],
  },
  about: {
    label: "About",
    title: "QuantNest is an execution-first automation platform",
    subtitle:
      "We help traders and quant teams convert strategy logic into reliable, observable workflows that can run with confidence.",
    lastUpdated: "March 2026",
    highlights: [
      { label: "Core focus", value: "Reliability + traceability" },
      { label: "Product style", value: "Visual, composable workflows" },
      { label: "Safety model", value: "Consent-aware AI actions" },
    ],
    sections: [
      {
        title: "Why QuantNest exists",
        body: "Most automation stacks are either too rigid for discretionary strategy work or too fragile for production execution. QuantNest bridges that gap with practical flow composition and deterministic execution logs.",
        checklist: [
          "Lower time from idea to deploy",
          "Reduce manual monitoring burden",
          "Improve post-trade learning loops",
        ],
      },
      {
        title: "How we build",
        body: "The platform is engineered around clean action contracts, strict validation, and iterative UX. Product decisions are shaped by real workflow operations, not demo-only scenarios.",
        checklist: [
          "Typed metadata and schema validation",
          "Action-level safeguards and conditions",
          "Incremental, feedback-driven shipping",
        ],
      },
      {
        title: "Who we serve",
        body: "QuantNest is built for operators running repeatable strategies across brokers and channels, where observability and execution consistency matter more than flashy dashboards.",
        checklist: [
          "Independent strategy traders",
          "Small quant teams and pods",
          "Broker-integrated automation setups",
        ],
      },
    ],
    faqs: [
      {
        question: "Is QuantNest no-code only?",
        answer: "No. It is visual-first with technical extensibility in roadmap so teams can start fast and add depth as workflows mature.",
      },
      {
        question: "How mature is the platform?",
        answer: "Core workflow build-run-observe loop is active today, with deeper documentation and policy pages now being expanded.",
      },
    ],
  },
  docs: {
    label: "Documentation",
    title: "Operational docs for building and running workflows",
    subtitle:
      "This documentation track is structured for implementation speed: setup, references, and deployment best practices.",
    lastUpdated: "March 2026",
    highlights: [
      { label: "Audience", value: "Builders and operators" },
      { label: "Format", value: "Task-first reference" },
      { label: "Depth", value: "Beginner to production" },
    ],
    sections: [
      {
        title: "Quickstart and fundamentals",
        body: "Start with trigger/action fundamentals and builder navigation. The quickstart path is optimized to create and execute a first workflow in minimal time.",
        checklist: [
          "Create trigger and action chain",
          "Configure broker credentials safely",
          "Run and inspect execution output",
        ],
      },
      {
        title: "Node and action references",
        body: "Each node type documents required metadata, expected behavior, and common failure modes so workflows are easier to reason about during iteration.",
        checklist: [
          "Timer, price, conditional triggers",
          "Zerodha, Groww, Lighter actions",
          "Notion and Drive reporting actions",
        ],
      },
      {
        title: "Deployment and operations",
        body: "Production docs focus on auth model, environment setup, Docker/K8s deployment, and CI workflow guidance for stable rollouts.",
        checklist: [
          "Environment variable matrix",
          "Container and pipeline setup",
          "Execution monitoring practices",
        ],
      },
    ],
    faqs: [
      {
        question: "Will API docs be public?",
        answer: "Yes. API and integration references are part of the docs expansion, with examples aligned to current workflow schema.",
      },
      {
        question: "Are migration notes included?",
        answer: "Changelog-linked migration notes will be included for breaking behavior and metadata changes.",
      },
    ],
  },
  changelog: {
    label: "Changelog",
    title: "Track feature releases and behavioral updates",
    subtitle:
      "This feed summarizes platform changes with clear impact notes so teams can update workflows without surprises.",
    lastUpdated: "March 2026",
    highlights: [
      { label: "Scope", value: "Engine, UI, integrations" },
      { label: "Cadence", value: "Continuous release flow" },
      { label: "Detail level", value: "Operator-friendly notes" },
    ],
    sections: [
      {
        title: "Execution engine changes",
        body: "Engine updates include conditional flow behavior, validation, scheduling windows, and action-level improvements affecting runtime outcomes.",
        checklist: [
          "Branching and routing updates",
          "Daily action scheduling safeguards",
          "Failure-path and status clarity",
        ],
      },
      {
        title: "Integration updates",
        body: "Integration notes cover broker verification, notification channels, reporting actions, and model-related enhancements.",
        checklist: [
          "Notion reporting refinements",
          "Google Drive CSV + AI insights",
          "WhatsApp/Gmail/Discord improvements",
        ],
      },
      {
        title: "Frontend and UX updates",
        body: "UI changes are called out with flow impact details so users can quickly adapt to updated onboarding and action configuration.",
        checklist: [
          "Builder refinements and sheets",
          "Landing continuity improvements",
          "Validation and feedback enhancements",
        ],
      },
    ],
    faqs: [
      {
        question: "How are breaking changes announced?",
        answer: "Breaking updates are explicitly tagged with required migration actions and references to affected nodes.",
      },
      {
        question: "Can teams subscribe to release alerts?",
        answer: "Release subscription options are planned under docs/contact expansion.",
      },
    ],
  },
  contact: {
    label: "Contact",
    title: "Support and partnership channels",
    subtitle:
      "Route requests by intent so support, product, and enterprise conversations move faster with the right owners.",
    lastUpdated: "March 2026",
    highlights: [
      { label: "Support focus", value: "Execution and workflow issues" },
      { label: "Partnerships", value: "Integrations and ecosystem" },
      { label: "Enterprise", value: "Security and deployment review" },
    ],
    sections: [
      {
        title: "Technical support",
        body: "For runtime failures or workflow behavior questions, provide workflow ID, node type, and execution timestamp to reduce triage time.",
        checklist: [
          "Include reproducible steps",
          "Attach execution log context",
          "Highlight expected vs actual result",
        ],
      },
      {
        title: "Integration and partner requests",
        body: "Broker and ecosystem partners can propose integration paths with API constraints, auth requirements, and expected user value.",
        checklist: [
          "Integration capability summary",
          "Auth and permission model",
          "Operational limits and SLAs",
        ],
      },
      {
        title: "Enterprise coordination",
        body: "Enterprise discussions include deployment architecture, policy requirements, and reliability expectations.",
        checklist: [
          "Compliance and legal track",
          "Deployment and infra review",
          "Commercial and support alignment",
        ],
      },
    ],
    faqs: [
      {
        question: "What is the expected first response time?",
        answer: "Response priority depends on severity and plan level; enterprise workflows receive dedicated handling.",
      },
      {
        question: "Can we request custom integration support?",
        answer: "Yes. Integration requests are evaluated based on security model, technical feasibility, and user impact.",
      },
    ],
  },
  careers: {
    label: "Careers",
    title: "Join the team building trading automation infrastructure",
    subtitle:
      "We are hiring engineers and product builders who can ship rigorously, think in systems, and care about real user outcomes.",
    lastUpdated: "March 2026",
    highlights: [
      { label: "Environment", value: "High ownership" },
      { label: "Product stage", value: "Rapid iteration" },
      { label: "Focus", value: "Execution quality" },
    ],
    sections: [
      {
        title: "Engineering roles",
        body: "Roles span frontend workflow UX, backend execution systems, integrations, and reliability. We value pragmatic judgment and strong delivery discipline.",
        checklist: [
          "TypeScript-first codebase",
          "Monorepo and shared package model",
          "Production-oriented quality bar",
        ],
      },
      {
        title: "Product and design",
        body: "Product roles focus on making advanced automation feel controlled and understandable without sacrificing speed.",
        checklist: [
          "Workflow UX clarity",
          "Operator-centered design decisions",
          "Data-informed feature iteration",
        ],
      },
      {
        title: "Hiring principles",
        body: "We hire for strong technical fundamentals, written clarity, and the ability to improve systems under real constraints.",
        checklist: [
          "Clear communication",
          "Practical engineering rigor",
          "Bias toward useful shipping",
        ],
      },
    ],
    faqs: [
      {
        question: "Do you hire remote?",
        answer: "Team setup is role dependent. Hiring details will include location expectations per opening.",
      },
      {
        question: "What does the interview process look like?",
        answer: "Expect focused technical evaluation, practical problem-solving, and a product-thinking conversation.",
      },
    ],
  },
  blog: {
    label: "Blog",
    title: "Engineering and strategy-ops insights",
    subtitle:
      "Long-form writing on workflow design, integration practices, and lessons from operating automation systems in production.",
    lastUpdated: "March 2026",
    highlights: [
      { label: "Content mix", value: "Technical + operational" },
      { label: "Depth", value: "Implementation-level detail" },
      { label: "Audience", value: "Builders and quant operators" },
    ],
    sections: [
      {
        title: "Engineering deep dives",
        body: "Posts will unpack execution engine decisions, scheduling behavior, action contracts, and reliability tradeoffs.",
        checklist: [
          "Runtime behavior analysis",
          "Integration architecture notes",
          "Performance and failure handling",
        ],
      },
      {
        title: "Workflow playbooks",
        body: "Playbooks focus on practical strategy automation patterns, from trigger design to post-trade reporting loops.",
        checklist: [
          "Robust branching strategies",
          "Risk-aware action sequencing",
          "Operational review patterns",
        ],
      },
      {
        title: "Release explainers",
        body: "Major updates will include rationale, migration guidance, and examples to reduce rollout friction for active users.",
        checklist: [
          "Feature rationale",
          "Before/after behavior notes",
          "Adoption checklist",
        ],
      },
    ],
    faqs: [
      {
        question: "How often will posts be published?",
        answer: "Publishing cadence will match meaningful product and engineering updates rather than arbitrary schedules.",
      },
      {
        question: "Can users request topics?",
        answer: "Yes. Topic requests can be routed through the contact path and prioritized by demand.",
      },
    ],
  },
  privacy: {
    label: "Privacy",
    title: "How QuantNest handles data and consent",
    subtitle:
      "Our privacy model is built around minimal necessary data use, explicit consent for AI/reporting actions, and clear user controls.",
    lastUpdated: "March 2026",
    highlights: [
      { label: "Data principle", value: "Need-to-operate scope" },
      { label: "AI boundary", value: "Consent-gated processing" },
      { label: "User control", value: "Revocable at action level" },
    ],
    sections: [
      {
        title: "Data categories",
        body: "Platform processing includes account/session data, workflow metadata, and execution logs necessary for workflow operation and troubleshooting.",
        checklist: [
          "Authentication and session state",
          "Workflow node/edge configuration",
          "Execution event and status logs",
        ],
      },
      {
        title: "AI and reporting consent",
        body: "AI-driven analysis and broker-derived reporting run only where users enable consent on relevant actions.",
        checklist: [
          "Opt-in by action configuration",
          "No raw credential payloads to models",
          "Clear consent messaging in UI",
        ],
      },
      {
        title: "Retention and revocation",
        body: "Users can remove workflows, revoke integrations, and disable consent-based features as operational needs change.",
        checklist: [
          "Action-level consent revocation",
          "Workflow removal capability",
          "Policy update transparency",
        ],
      },
    ],
    faqs: [
      {
        question: "Are broker credentials sent to AI?",
        answer: "No. Credential material is isolated from model payloads; only consented contextual data is used for analysis.",
      },
      {
        question: "Can I disable AI without disabling workflow execution?",
        answer: "Yes. AI/reporting consent can be disabled while preserving core workflow execution actions.",
      },
    ],
  },
  terms: {
    label: "Terms",
    title: "Platform terms for workflow execution usage",
    subtitle:
      "These terms define responsibilities, permitted use, and operational boundaries for using QuantNest automations and integrations.",
    lastUpdated: "March 2026",
    highlights: [
      { label: "Responsibility", value: "User-owned strategy risk" },
      { label: "Usage scope", value: "Authorized integrations only" },
      { label: "Service model", value: "Evolving platform terms" },
    ],
    sections: [
      {
        title: "Acceptable use",
        body: "Users must operate only with authorized credentials and compliant broker/API usage patterns.",
        checklist: [
          "No unauthorized credential usage",
          "No abusive or unlawful operations",
          "Follow broker/exchange constraints",
        ],
      },
      {
        title: "Execution responsibility",
        body: "Workflow outcomes depend on user-configured logic and market conditions. Users are responsible for validating strategy behavior before live operation.",
        checklist: [
          "Pre-deployment testing required",
          "Ongoing monitoring encouraged",
          "Risk controls remain user-owned",
        ],
      },
      {
        title: "Service and updates",
        body: "Features and limits may evolve. Material changes will be reflected via changelog and updated terms references.",
        checklist: [
          "Versioned change visibility",
          "Plan-based support expectations",
          "Operational maintenance windows",
        ],
      },
    ],
    faqs: [
      {
        question: "Does QuantNest guarantee trading outcomes?",
        answer: "No. QuantNest provides workflow infrastructure; strategy performance and market risk remain user responsibility.",
      },
      {
        question: "How are policy changes communicated?",
        answer: "Policy and terms updates are published with revision markers and accompanying notes where relevant.",
      },
    ],
  },
  cookie: {
    label: "Cookie Policy",
    title: "Session and cookie behavior in QuantNest",
    subtitle:
      "Cookies are used for secure authentication and core product continuity. Policy details focus on essential vs functional usage.",
    lastUpdated: "March 2026",
    highlights: [
      { label: "Primary use", value: "Secure session handling" },
      { label: "Scope", value: "Essential + functional cookies" },
      { label: "Control", value: "Browser-level management" },
    ],
    sections: [
      {
        title: "Essential cookies",
        body: "Required cookies maintain authentication context and protected route access.",
        checklist: [
          "Session identity continuity",
          "Security and access checks",
          "Core navigation integrity",
        ],
      },
      {
        title: "Functional cookies",
        body: "Functional cookies may retain non-sensitive preferences to improve interaction continuity.",
        checklist: [
          "User experience continuity",
          "Low-friction repeated usage",
          "No impact on core security boundaries",
        ],
      },
      {
        title: "Managing cookies",
        body: "Users can clear or block cookies through browser settings, with expected session reset behavior.",
        checklist: [
          "User-controlled browser settings",
          "Re-authentication after clearing sessions",
          "Policy updates reflected in docs",
        ],
      },
    ],
    faqs: [
      {
        question: "Will disabling cookies break the app?",
        answer: "Disabling essential cookies can prevent authentication and protected route access.",
      },
      {
        question: "Can preferences be reset anytime?",
        answer: "Yes. Clearing browser storage resets session and functional preferences.",
      },
    ],
  },
};

function SectionCard({ section }: { section: PageSection }) {
  return (
    <article className="rounded-2xl border border-neutral-800 bg-neutral-950/70 p-5">
      <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-[#f17463]">
        {section.title}
      </h2>
      <p className="mt-3 text-sm leading-6 text-neutral-400">{section.body}</p>
      <ul className="mt-4 space-y-2.5">
        {section.checklist.map((item) => (
          <li key={item} className="flex items-start gap-2 text-sm text-neutral-300">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </article>
  );
}

function FaqCard({ faq }: { faq: PageFaq }) {
  return (
    <article className="rounded-xl border border-neutral-800 bg-neutral-950/60 p-4">
      <h3 className="text-sm font-medium text-neutral-100">{faq.question}</h3>
      <p className="mt-2 text-sm leading-6 text-neutral-400">{faq.answer}</p>
    </article>
  );
}

export const StaticContentPage = ({ pageKey }: { pageKey: keyof typeof PAGE_CONFIG }) => {
  const navigate = useNavigate();
  const page = PAGE_CONFIG[pageKey];
  const isPricingPage = pageKey === "pricing";

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-black px-6 pb-16 pt-28 text-white md:px-10">
      <AppBackground />
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(1100px_480px_at_82%_-8%,rgba(241,116,99,0.15),transparent_62%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(900px_420px_at_100%_78%,rgba(56,189,248,0.09),transparent_66%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(255,255,255,0.02),transparent_24%,transparent_78%,rgba(255,255,255,0.015))]" />
      </div>
      <div className="mx-auto max-w-6xl">
        <section className="relative overflow-hidden rounded-3xl border border-neutral-800 bg-linear-to-br from-neutral-950 via-black to-neutral-950/80 p-8 md:p-12">
          <div className="pointer-events-none absolute -left-12 top-6 h-64 w-64 rounded-full bg-[#f17463]/12 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-10 right-4 h-64 w-64 rounded-full bg-sky-500/10 blur-3xl" />

          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 rounded-full border border-neutral-700/80 bg-neutral-900/70 px-3 py-1 text-xs text-neutral-300">
              <Sparkles className="h-3.5 w-3.5 text-[#f17463]" />
              <span>{page.label}</span>
            </div>

            <h1 className="mt-4 max-w-4xl text-3xl font-semibold tracking-tight text-neutral-50 md:text-5xl">
              {page.title}
            </h1>
            <p className="mt-4 max-w-3xl text-sm leading-6 text-neutral-400 md:text-base">
              {page.subtitle}
            </p>

            <div className="mt-5 inline-flex items-center gap-2 rounded-lg border border-neutral-700/80 bg-neutral-900/50 px-3 py-2 text-xs text-neutral-300">
              <CalendarClock className="h-3.5 w-3.5 text-sky-300" />
              <span>Last updated: {page.lastUpdated}</span>
            </div>
          </div>
        </section>

        {!isPricingPage && (
          <section className="mt-6 grid gap-4 md:grid-cols-3">
            {page.highlights.map((item) => (
              <article key={item.label} className="rounded-xl border border-neutral-800 bg-neutral-950/60 p-4">
                <p className="text-[11px] uppercase tracking-[0.16em] text-neutral-500">{item.label}</p>
                <p className="mt-2 text-sm font-medium text-neutral-200">{item.value}</p>
              </article>
            ))}
          </section>
        )}

        {!isPricingPage && (
          <section className="mt-8 grid gap-4 md:grid-cols-3">
            {page.sections.map((section) => (
              <SectionCard key={section.title} section={section} />
            ))}
          </section>
        )}

        {page.pricingPlans && <PricingPlans plans={page.pricingPlans} />}

        <section className="mt-8 rounded-2xl border border-neutral-800 bg-neutral-950/60 p-6">
          <div className="flex items-center gap-2">
            <CircleHelp className="h-4 w-4 text-sky-300" />
            <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-neutral-300">
              Frequently Asked Questions
            </h2>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {page.faqs.map((faq) => (
              <FaqCard key={faq.question} faq={faq} />
            ))}
          </div>
        </section>

        <section className="mt-8 rounded-2xl border border-neutral-800 bg-linear-to-r from-neutral-950 to-neutral-900/40 p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-neutral-700 bg-neutral-900/60 px-3 py-1 text-[11px] uppercase tracking-[0.14em] text-neutral-400">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-300" />
                <span>Operator Ready</span>
              </div>
              <p className="mt-3 max-w-xl text-sm text-neutral-300">
                Continue building workflows while these pages keep evolving with live product updates.
              </p>
            </div>
            <button
              type="button"
              className="inline-flex w-fit cursor-pointer items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-medium text-neutral-900 transition hover:bg-neutral-200"
              onClick={() =>
                navigate(hasAuthSession() ? "/create/onboarding" : "/signup")
              }
            >
              Start Building
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </section>

        <div className="mt-6 flex items-center justify-end text-xs text-neutral-500">
          <button
            type="button"
            onClick={() => navigate("/")}
            className="inline-flex cursor-pointer items-center gap-1.5 transition-colors hover:text-neutral-300"
          >
            <span>Back to home</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
