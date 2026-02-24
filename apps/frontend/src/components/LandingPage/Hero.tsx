import { useNavigate } from "react-router-dom"
import ShimmeringText from "../ui/shimmer-text"
import { hasAuthSession } from "@/http";

export const Hero = () => {
    const navigate = useNavigate();
    return (
        <div className="border-y border-neutral-800">
            <div className="h-180 mx-20 border-x border-neutral-800">
                <div className="pt-40 flex flex-col items-center gap-6">
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
                                    navigate("/create");
                                } else {
                                    navigate("/signup");
                                }
                            }}
                        >
                            Start Building
                        </button>
                        <button className="bg-black text-neutral-200 font-normal px-6 py-2 cursor-pointer rounded-lg border border-neutral-700 hover:bg-neutral-800 transistion duration-200">View Pricing</button>
                    </div>
                    <div className="mt-8 flex flex-col items-center">
                        <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-linear-to-r from-[#18181b] via-[#26262c] to-[#18181b] border border-neutral-700 shadow-inner shadow-[#f1746333]/5">
                            <span className="text-xs font-semibold text-[#f17463] tracking-[.18em] uppercase">
                                Trusted by Quants
                            </span>
                            <span className="mx-1 text-xs text-neutral-400">·</span>
                            <span className="text-xs text-neutral-300 font-medium">
                                Lightning-fast strategy builder
                            </span>
                            <span className="mx-1 text-xs text-neutral-400">·</span>
                            <span className="text-xs font-semibold text-neutral-100">
                                QuantNest Trading
                            </span>
                            <svg xmlns="http://www.w3.org/2000/svg" className="ml-2 w-4 h-4 text-[#f17463]" viewBox="0 0 24 24" fill="none">
                                <circle cx="12" cy="12" r="10" stroke="#f17463" strokeWidth="2" fill="currentColor" fillOpacity="0.15"/>
                                <path d="M8 12l2 2l4 -4" stroke="#f17463" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                            </svg>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
