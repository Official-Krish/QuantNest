import { AnimatedShinyText } from "../ui/animated-shiny-text"

export const Hero = () => {
    return (
        <div className="border-y border-neutral-800">
            <div className="h-170 mx-20 border-x border-neutral-800">
                <div className="pt-40 flex flex-col items-center gap-6">
                    <AnimatedShinyText className="text-[#f17463]">For serious traders and quant teams</AnimatedShinyText>
                    <div className="max-w-2xl flex justify-center text-center">
                        <h1 className="text-white font-medium text-6xl">
                            Visual automation for trading <span className="text-[#f17463]">strategies</span>
                        </h1>
                    </div>
                    <div className="max-w-lg text-gray-300 tracking-tight font-medium text-sm text-center">
                        A visual platform to build, test, and deploy AI-powered trading workflows across stocks, options, and Web3
                    </div>
                    <div className="flex space-x-4">
                        <button className="bg-white text-neutral-800 font-normal px-6 py-2 cursor-pointer rounded-lg">Start Building</button>
                        <button className="bg-black text-neutral-200 font-normal px-6 py-2 cursor-pointer rounded-lg border border-neutral-700 hover:bg-neutral-800 transistion duration-200">View Pricing</button>
                    </div>
                </div>
            </div>
        </div>
    )
}