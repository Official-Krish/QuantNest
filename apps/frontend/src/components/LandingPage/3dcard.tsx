import { CardBody, CardContainer, CardItem } from "../ui/3d-card"

export const AnimatedCard = () => {
    return (
        <div className="border-y border-neutral-800">
            <div
                className="relative mx-20 flex items-center justify-center py-16 overflow-hidden border-x border-neutral-800"
                style={{
                    background: "radial-gradient(ellipse 80% 60% at 50% 50%, rgba(241,116,99,0.05) 0%, transparent 70%)"
                }}
            >
                <div
                    className="absolute inset-0 opacity-[0.03]"
                    style={{
                        backgroundImage: "linear-gradient(to right,#fff 1px,transparent 1px),linear-gradient(to bottom,#fff 1px,transparent 1px)",
                        backgroundSize: "48px 48px"
                    }}
                />

                <CardContainer className="inter-var w-full max-w-6xl">
                    <CardBody className="w-full">
                        <CardItem translateZ="40" className="w-full">
                            <div
                                className="rounded-2xl overflow-hidden"
                                style={{
                                    border: "1px solid rgba(255,255,255,0.08)",
                                    boxShadow: "0 0 0 1px rgba(255,255,255,0.04) inset, 0 32px 80px -16px rgba(0,0,0,0.85)",
                                    background: "#0a0a0a"
                                }}
                            >
                                <div
                                    className="flex items-center gap-2 px-4"
                                    style={{
                                        height: "36px",
                                        background: "#111111",
                                        borderBottom: "1px solid rgba(255,255,255,0.06)"
                                    }}
                                >
                                    <div className="flex items-center gap-1.5">
                                        <span className="h-3 w-3 rounded-full bg-[#ff5f57]" />
                                        <span className="h-3 w-3 rounded-full bg-[#febc2e]" />
                                        <span className="h-3 w-3 rounded-full bg-[#28c840]" />
                                    </div>

                                    <div
                                        className="mx-auto flex items-center gap-1.5 rounded-md px-3 py-1"
                                        style={{
                                            background: "rgba(255,255,255,0.05)",
                                            border: "1px solid rgba(255,255,255,0.07)",
                                            minWidth: "180px"
                                        }}
                                    >
                                        <span className="h-1.5 w-1.5 rounded-full bg-[#f17463]/60" />
                                        <span className="text-[11px] text-neutral-500 tracking-tight">
                                            app.quantnest.in/dashboard
                                        </span>
                                    </div>
                                    <div className="w-13.5" />
                                </div>

                                {/* Dashboard screenshot */}
                                <img
                                    src="/Dashboard.png"
                                    className="w-full object-cover block"
                                    alt="QuantNest Dashboard"
                                />
                            </div>

                        </CardItem>
                    </CardBody>
                </CardContainer>
            </div>
        </div>
    )
}