import { hasAuthSession } from "@/http";
import { ArrowLeft, ArrowRight, Clock3, Sparkles } from "lucide-react";
import { useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";

type ComingSoonContent = {
  title: string;
  description: string;
  eta: string;
};

const CONTENT_MAP: Record<string, ComingSoonContent> = {
  pricing: {
    title: "Pricing is coming soon",
    description:
      "We are finalizing transparent plan tiers for individual traders, teams, and prop desks.",
    eta: "Planned rollout: soon",
  },
  "example-workflows": {
    title: "Example workflows are coming soon",
    description:
      "We are curating production-ready strategy templates that you can fork and run quickly.",
    eta: "Template gallery in progress",
  },
  about: {
    title: "About page is coming soon",
    description:
      "We are preparing a full company overview including product vision, roadmap, and team details.",
    eta: "Company profile in progress",
  },
  docs: {
    title: "Docs are coming soon",
    description:
      "Documentation for workflow nodes, broker integrations, and deployment guides is being prepared.",
    eta: "Developer docs in progress",
  },
  changelog: {
    title: "Changelog is coming soon",
    description:
      "A public release log with versioned updates and migration notes will be available here.",
    eta: "Release feed in progress",
  },
  contact: {
    title: "Contact page is coming soon",
    description:
      "We are setting up support and enterprise contact channels with SLA details.",
    eta: "Support channels in progress",
  },
  careers: {
    title: "Careers page is coming soon",
    description:
      "We are defining open roles across engineering, product, and developer relations.",
    eta: "Hiring page in progress",
  },
  blog: {
    title: "Blog is coming soon",
    description:
      "We will publish technical writeups, strategy breakdowns, and platform updates here.",
    eta: "Editorial pipeline in progress",
  },
  privacy: {
    title: "Privacy policy is coming soon",
    description:
      "A detailed privacy policy covering data use, storage, and retention is being finalized.",
    eta: "Policy review in progress",
  },
  terms: {
    title: "Terms of service are coming soon",
    description:
      "Service terms and usage guidelines are being prepared for public release.",
    eta: "Legal review in progress",
  },
  cookie: {
    title: "Cookie policy is coming soon",
    description:
      "Cookie usage and preference controls documentation is being finalized.",
    eta: "Policy review in progress",
  },
};

export const ComingSoon = () => {
  const navigate = useNavigate();
  const { feature } = useParams<{ feature: string }>();

  const content = useMemo(() => {
    if (!feature) return CONTENT_MAP.docs;
    return CONTENT_MAP[feature] || {
      title: "This section is coming soon",
      description:
        "We are actively building this experience. Continue using workflow creation and execution features in the meantime.",
      eta: "In active development",
    };
  }, [feature]);

  return (
    <div className="min-h-screen w-full bg-black px-6 pb-16 pt-28 text-white md:px-10">
      <div className="mx-auto max-w-4xl">
        <div className="relative overflow-hidden rounded-3xl border border-neutral-800 bg-linear-to-br from-neutral-950 via-black to-neutral-950/80 p-8 md:p-12">
          <div className="pointer-events-none absolute -left-12 top-8 h-56 w-56 rounded-full bg-[#f17463]/15 blur-3xl" />
          <div className="pointer-events-none absolute bottom-0 right-0 h-56 w-56 rounded-full bg-sky-500/10 blur-3xl" />

          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 rounded-full border border-neutral-700 bg-neutral-900/70 px-3 py-1 text-xs text-neutral-300">
              <Sparkles className="h-3.5 w-3.5 text-[#f17463]" />
              <span>QuantNest Roadmap</span>
            </div>

            <h1 className="mt-5 text-3xl font-semibold tracking-tight text-neutral-50 md:text-4xl">
              {content.title}
            </h1>
            <p className="mt-3 max-w-2xl text-sm text-neutral-400 md:text-base">
              {content.description}
            </p>

            <div className="mt-6 inline-flex items-center gap-2 rounded-lg border border-neutral-700/80 bg-neutral-900/50 px-3 py-2 text-xs text-neutral-300">
              <Clock3 className="h-3.5 w-3.5 text-sky-300" />
              <span>{content.eta}</span>
            </div>

            <div className="mt-10 flex flex-wrap gap-3">
              <button
                type="button"
                className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-neutral-700 bg-black/60 px-4 py-2 text-sm text-neutral-200 transition hover:bg-neutral-900"
                onClick={() => navigate(-1)}
              >
                <ArrowLeft className="h-4 w-4" />
                Go back
              </button>
              <button
                type="button"
                className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-medium text-neutral-900 transition hover:bg-neutral-200"
                onClick={() =>
                  navigate(hasAuthSession() ? "/create/onboarding" : "/signup")
                }
              >
                Start Building
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
