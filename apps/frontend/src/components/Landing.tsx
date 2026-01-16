import { AnimatedCard } from "./LandingPage/3dcard"
import { Features } from "./LandingPage/Features"
import { Hero } from "./LandingPage/Hero"

export const Landing = () => {
    return (
        <div className="bg-black min-h-screen w-full">
            <Hero />
            <AnimatedCard />
            <Features />
        </div>
    )
}