import { AnimatedCard } from "./LandingPage/3dcard"
import { Features } from "./LandingPage/Features"
import { Hero } from "./LandingPage/Hero"
import { Start } from "./LandingPage/Start"
import { UseCase } from "./LandingPage/useCase"

export const Landing = () => {
    return (
        <div className="bg-black min-h-screen w-full">
            <Hero />
            <AnimatedCard />
            <Features />
            <UseCase />
            <Start />
        </div>
    )
}