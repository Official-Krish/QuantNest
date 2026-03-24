import { useNavigate } from "react-router-dom"
import { motion } from "motion/react"
import ShimmeringText from "../ui/shimmer-text"
import { hasAuthSession } from "@/http";

type HeroProps = {
    onPricingClick: () => void
}

export const Hero = ({ onPricingClick }: HeroProps) => {
    const navigate = useNavigate();
    const STAT_CARDS = [
        { value: "4+", label: "Brokers Supported", sub: "Zerodha · Groww · Lighter · More" },
        { value: "<2s", label: "Execution Latency", sub: "Trigger to order placement" },
        { value: "∞", label: "Workflow Branches", sub: "True/false conditional logic" },
        { value: "14d", label: "Free Trial", sub: "No credit card required" },
    ]
    return (
        <div className="border-y border-neutral-800">
            <div className="relative h-180 mx-20 border-x border-neutral-800 overflow-hidden">
                <div className="pointer-events-none absolute inset-0">
                    <motion.div
                        className="absolute left-[28%] top-18 h-120 w-176 -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(241,116,99,0.14)_0%,rgba(241,116,99,0.06)_34%,rgba(0,0,0,0)_72%)]"
                        animate={{ x: [0, 16, 0], y: [0, -10, 0], scale: [1, 1.04, 1] }}
                        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
                    />
                    <motion.div
                        className="absolute left-[68%] top-40 h-88 w-136 -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(56,189,248,0.06)_0%,rgba(56,189,248,0.02)_36%,rgba(0,0,0,0)_70%)]"
                        animate={{ x: [0, -14, 0], y: [0, 8, 0], scale: [1, 1.03, 1] }}
                        transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
                    />
                    <div className="absolute inset-0 opacity-[0.04] bg-[linear-gradient(to_right,#ffffff_1px,transparent_1px),linear-gradient(to_bottom,#ffffff_1px,transparent_1px)]" />
                </div>
                <div className="relative z-10 pt-40 flex flex-col items-center gap-6">
                    <div className="inline-flex items-center gap-2 rounded-full border border-[#8f3c1f] bg-[#2a120f]/70 px-4 py-1.5 shadow-[0_0_0_1px_rgba(255,107,53,0.08),0_10px_26px_-18px_rgba(241,116,99,0.9)] backdrop-blur-sm">
                        <span className="h-2 w-2 rounded-full bg-[#f17463]" />
                        <span className="text-[10px] font-medium uppercase tracking-[0.12em] text-[#ff7b45] sm:text-[11px]">
                            Now in Early Access
                        </span>
                    </div>
                    <ShimmeringText duration={0.3} text="For serious traders and quant teams" className="text-[#f17463] text-sm font-normal tracking-widest" />
                    <div className="max-w-2xl flex justify-center text-center">
                        <h1 className="text-white font-medium text-6xl">
                            Visual automation for trading <span className="text-[#f17463]">strategies</span>
                        </h1>
                    </div>
                    <div className="max-w-lg text-gray-300 tracking-tight font-medium text-sm text-center">
                        A visual platform to build, test, and deploy AI-powered trading workflows across stocks, options, and Web3
                    </div>
                    <div className="flex space-x-4">
                        <button 
                            className="bg-white text-neutral-800 font-normal px-6 py-2 cursor-pointer rounded-lg"
                            onClick={() => {
                                if (hasAuthSession()){
                                    navigate("/create/onboarding");
                                } else {
                                    navigate("/signup");
                                }
                            }}
                        >
                            Start Building
                        </button>
                        <button
                            className="bg-black text-neutral-200 font-normal px-6 py-2 cursor-pointer rounded-lg border border-neutral-700 hover:bg-neutral-800 transition duration-200"
                            onClick={onPricingClick}
                        >
                            View Pricing
                        </button>
                    </div>
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.85 }}
                        className="grid grid-cols-4 gap-px w-full max-w-3xl rounded-xl overflow-hidden border border-neutral-800/80"
                    >
                        {STAT_CARDS.map((card, i) => (
                            <div
                                key={card.label}
                                className="flex flex-col items-center justify-center py-5 px-4 bg-neutral-950/80 backdrop-blur-sm"
                                style={{
                                    borderRight: i < STAT_CARDS.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none"
                                }}
                            >
                                <span
                                    className="text-[28px] font-bold leading-none mb-1.5"
                                    style={{
                                        color: "#f17463",
                                        textShadow: "0 0 20px rgba(241,116,99,0.25)",
                                    }}
                                >
                                    {card.value}
                                </span>
                                <span className="text-[12px] font-semibold text-neutral-300 mb-1">{card.label}</span>
                                <span className="text-[11px] text-neutral-600 text-center leading-tight">{card.sub}</span>
                            </div>
                        ))}
                    </motion.div>
                </div>
            </div>
        </div>
    )
}
