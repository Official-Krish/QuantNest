import { useState } from "react"
import { AnimatedCard } from "../components/LandingPage/3dcard"
import { ComingSoonModal } from "../components/LandingPage/ComingSoonModal"
import { Features } from "../components/LandingPage/Features"
import { Hero } from "../components/LandingPage/Hero"
import { HowItWorks } from "../components/LandingPage/HowItWorks"
import { PricingPreview } from "../components/LandingPage/PricingPreview"
import { Start } from "../components/LandingPage/Start"
import { UseCase } from "../components/LandingPage/useCase"

export const Landing = () => {
    const [comingSoonTarget, setComingSoonTarget] = useState<"pricing" | "examples" | null>(null)

    return (
        <div className="bg-black min-h-screen w-full">
            <Hero onPricingClick={() => setComingSoonTarget("pricing")} />
            <AnimatedCard />
            <Features />
            <HowItWorks />
            <UseCase />
            <PricingPreview />
            <Start onExampleWorkflowsClick={() => setComingSoonTarget("examples")} />
            <ComingSoonModal
                open={comingSoonTarget !== null}
                onOpenChange={(open) => {
                    if (!open) setComingSoonTarget(null)
                }}
                title={
                    comingSoonTarget === "pricing"
                        ? "Pricing plans are being finalized"
                        : "Example workflow gallery is in progress"
                }
                description={
                    comingSoonTarget === "pricing"
                        ? "We are finalizing plan tiers for individual traders, teams, and prop desks. You can start building now and we will publish transparent pricing shortly."
                        : "We are curating production-grade examples for momentum, mean reversion, and options workflows so new users can fork and deploy quickly."
                }
            />
        </div>
    )
}
