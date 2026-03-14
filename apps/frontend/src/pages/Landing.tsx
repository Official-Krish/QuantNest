import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { AnimatedCard } from "../components/LandingPage/3dcard"
import { ComingSoonModal } from "../components/LandingPage/ComingSoonModal"
import { Features } from "../components/LandingPage/Features"
import { Hero } from "../components/LandingPage/Hero"
import { HowItWorks } from "../components/LandingPage/HowItWorks"
import { PricingPreview } from "../components/LandingPage/PricingPreview"
import { Start } from "../components/LandingPage/Start"
import { UseCase } from "../components/LandingPage/useCase"

export const Landing = () => {
    const [comingSoonTarget, setComingSoonTarget] = useState<"pricing" | null>(null)
    const navigate = useNavigate()

    return (
        <div className="bg-black min-h-screen w-full">
            <Hero onPricingClick={() => setComingSoonTarget("pricing")} />
            <AnimatedCard />
            <Features />
            <HowItWorks />
            <UseCase />
            <PricingPreview />
            <Start onExampleWorkflowsClick={() => navigate("/examples")} />
            <ComingSoonModal
                open={comingSoonTarget !== null}
                onOpenChange={(open) => {
                    if (!open) setComingSoonTarget(null)
                }}
                title={
                    "Pricing plans are being finalized"
                }
                description={
                    "We are finalizing plan tiers for individual traders, teams, and prop desks. You can start building now and we will publish transparent pricing shortly."
                }
            />
        </div>
    )
}
