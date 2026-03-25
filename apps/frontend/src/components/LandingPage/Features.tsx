import { useEffect, useRef, useState } from "react"

import {
  BellIcon,
  CalendarIcon,
  FileTextIcon,
  GlobeIcon,
  InputIcon,
} from "@radix-ui/react-icons"

import { BentoCard, BentoGrid } from "@/components/ui/bento-grid-feature"
import { AnimatedList } from "../ui/animated-list"
import NotificationCard from "./NotificationCard"
import { WorkflowNodePreview } from "./WorkflowNodePreview"

export const Features = () => {
  const notificationRef = useRef<HTMLDivElement | null>(null)
  const [notificationsActive, setNotificationsActive] = useState(false)

  useEffect(() => {
    if (!notificationRef.current) return

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries
        if (entry.isIntersecting) {
          setNotificationsActive(true)
          if (notificationRef.current) {
            observer.unobserve(notificationRef.current)
          }
        }
      },
      {
        threshold: 0.4,
        rootMargin: "0px 0px -15% 0px",
      }
    )

    observer.observe(notificationRef.current)

    return () => observer.disconnect()
  }, [])

  return (
    <div className="border-y border-neutral-800">
      <div className="mx-4 md:mx-12 lg:mx-20 border border-neutral-800 bg-black/90 backdrop-blur">
        <div className="py-16 md:py-20 flex justify-center items-center border-b border-neutral-800 px-4">
          <div className="text-center">
            <h2 className="text-md font-normal text-[#f17463]">Features</h2>
            <h1 className="text-2xl font-medium tracking-tight md:text-3xl lg:text-4xl text-neutral-100 mt-4">
              Built for Intelligent Trading Automation
            </h1>
            <h3 className="text-sm font-medium tracking-tight md:text-sm lg:text-base text-gray-300 mx-auto mt-6 max-w-lg px-2">
              Design test and deploy AI powered trading strategies using an intuitive visual workflow engine built for modern traders
            </h3>
          </div>
        </div>
        <div className="py-10 flex justify-center items-center px-4">
          <BentoGrid className="lg:grid-rows-2 lg:auto-rows-[18rem]">
            {features(notificationsActive, notificationRef).map((feature) => (
              <BentoCard key={feature.name} {...feature} />
            ))}
          </BentoGrid>
        </div>
      </div>
    </div>
  )
}

const notifications = [
  {
    name: "Price Alert",
    message: "The price of AAPL has dropped below your set threshold.",
    time: "5m",
    accentClasses: "from-rose-500 to-amber-500 shadow-rose-500/30",
    icon: <BellIcon className="w-full h-full" />,
  },
  {
    name: "Trade Executed",
    message: "Your order to buy 100 shares of TSLA has been executed.",
    time: "15m",
    accentClasses: "from-emerald-500 to-teal-500 shadow-emerald-500/30",
    icon: <FileTextIcon className="w-full h-full" />,
  },
  {
    name: "Stop Loss Hit",
    message: "Your stop loss for GOOGL has been triggered at $2,500.",
    time: "30m",
    accentClasses: "from-red-500 to-orange-500 shadow-red-500/30",
    icon: <CalendarIcon className="w-full h-full" />,
  },
  {
    name: "Margin Call",
    message: "Your account has fallen below the required margin level.",
    time: "1h",
    accentClasses: "from-amber-500 to-yellow-500 shadow-amber-500/30",
    icon: <GlobeIcon className="w-full h-full" />,
  },
  {
    name: "RSI Signal",
    message: "RSI(14) on HDFC crossed below 30 on the 15m timeframe.",
    time: "1h",
    accentClasses: "from-cyan-500 to-blue-500 shadow-cyan-500/30",
    icon: <InputIcon className="w-full h-full" />,
  },
  {
    name: "Take Profit Hit",
    message: "Your NIFTY long target was reached and profit booking is complete.",
    time: "2h",
    accentClasses: "from-emerald-500 to-lime-500 shadow-emerald-500/30",
    icon: <CalendarIcon className="w-full h-full" />,
  },
] 

const BacktestPreview = () => {
  const bars = [42, 58, 35, 71, 55, 88, 64, 79, 47, 93, 68, 82]
  return (
    <div className="relative h-40 overflow-hidden border-b border-neutral-800/70 bg-gradient-to-b from-neutral-900/90 to-transparent">
      {/* Equity curve line */}
      <svg
        className="absolute inset-0 w-full h-full opacity-30"
        viewBox="0 0 200 80"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="curveGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#f17463" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#f17463" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path
          d="M0,70 C20,65 30,58 50,45 C70,32 80,50 100,38 C120,26 130,20 150,14 C170,8 180,10 200,6"
          fill="none"
          stroke="#f17463"
          strokeWidth="1.5"
        />
        <path
          d="M0,70 C20,65 30,58 50,45 C70,32 80,50 100,38 C120,26 130,20 150,14 C170,8 180,10 200,6 L200,80 L0,80 Z"
          fill="url(#curveGrad)"
        />
      </svg>
 
      {/* Bar chart */}
      <div className="absolute inset-x-5 bottom-12 flex h-14 items-end gap-1">
        {bars.map((h, i) => (
          <div
            key={i}
            className="flex-1 rounded-sm transition-all duration-300"
            style={{
              height: `${h}%`,
              background: h > 70
                ? "rgba(241,116,99,0.7)"
                : h > 50
                  ? "rgba(241,116,99,0.35)"
                  : "rgba(255,255,255,0.08)",
            }}
          />
        ))}
      </div>
 
      {/* Stats row */}
      <div className="absolute inset-x-5 bottom-3 flex gap-3">
        {[
          { label: "Win Rate", value: "67%" },
          { label: "Max DD", value: "-8.2%" },
          { label: "Sharpe", value: "1.84" },
        ].map((s) => (
          <div key={s.label} className="flex-1 rounded-md bg-neutral-800/60 px-2 py-1.5 text-center">
            <div className="text-[10px] text-neutral-500 mb-0.5">{s.label}</div>
            <div
              className="text-[12px] font-semibold"
              style={{ color: s.label === "Max DD" ? "#ef4444" : "#f17463" }}
            >
              {s.value}
            </div>
          </div>
        ))}
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-[#151515] to-transparent" />
    </div>
  )
}
 
// ── AI Chat preview illustration ───────────────────────────────────────────────
const AIChatPreview = () => (
  <div className="relative h-36 overflow-hidden border-b border-neutral-800/70 bg-gradient-to-b from-neutral-900/90 to-transparent px-4 pt-3">
    <div className="flex flex-col gap-2">
      {/* User message */}
      <div className="self-end max-w-[80%] rounded-xl rounded-br-sm bg-neutral-700/60 px-3 py-2">
        <p className="text-[11px] leading-snug text-neutral-300">
          Buy HDFC below ₹1000, alert via Gmail
        </p>
      </div>
      {/* AI response */}
      <div className="self-start max-w-[85%] rounded-xl rounded-bl-sm border border-neutral-700/60 bg-neutral-900/80 px-3 py-2">
        <p className="text-[11px] leading-snug text-neutral-400">
          ✓ Workflow created — 3 nodes: Price trigger → Zerodha buy → Gmail alert
        </p>
      </div>
      {/* Typing indicator */}
      <div className="self-start flex items-center gap-1 rounded-xl border border-neutral-800 bg-neutral-900/60 px-3 py-2">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#f17463]"
            style={{ animationDelay: `${i * 0.15}s`, animationDuration: "0.9s" }}
          />
        ))}
      </div>
    </div>

    <div className="pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-[#151515] to-transparent" />
  </div>
)


const features = (
  notificationsActive: boolean,
  notificationRef: React.RefObject<HTMLDivElement | null>
) => [
  {
    Icon: FileTextIcon,
    name: "Multi-Market Support",
    description:
      "Trade across equities, F&O, and upcoming Web3 protocols from a single workflow.",
    href: "/",
    cta: "Learn more",
    status: "Live",
    statusTone: "live" as const,
    background: (
      <div className="relative h-36 overflow-hidden border-b border-neutral-800/70 bg-gradient-to-b from-neutral-900/90 to-transparent">
        <WorkflowNodePreview
          kind="action"
          title="Execute on Zerodha / Groww"
          subtitle="Route the same strategy to multiple broker actions."
          badges={["IND", "F&O"]}
        />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-[#151515] to-transparent" />
      </div>
    ),
    className: "lg:col-start-3 lg:col-end-4 lg:row-start-2 lg:row-end-3",
  },
  {
    Icon: BellIcon,
    name: "Notification Feed",
    description:
      "Stay continuously informed with a real-time event stream covering trade executions, trigger hits, risk signals, broker errors, and daily summaries, so you always know what your workflows are doing without opening each strategy one by one.",
    href: "/",
    cta: "Learn more",
    status: "Live",
    statusTone: "live" as const,
    background: (
      <div
        ref={notificationRef}
        className="relative h-44 overflow-hidden border-b border-neutral-800/70 bg-gradient-to-b from-neutral-900/90 to-transparent lg:h-[430px]"
      >
        <AnimatedList
          isActive={notificationsActive}
          delay={1200}
          className="h-full items-start overflow-hidden p-3"
        >
          {notifications.map((notification, index) => (
            <NotificationCard
              key={index}
              name={notification.name}
              message={notification.message}
              time={notification.time}
              icon={notification.icon}
              accentClasses={notification.accentClasses}
            />
          ))}
        </AnimatedList>
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-[#151515] to-transparent" />
      </div>
    ),
    className:
      "lg:row-start-1 lg:row-end-3 lg:col-start-2 lg:col-end-3 border border-neutral-800/60 bg-neutral-900/40",
  },
  {
    Icon: InputIcon,
    name: "Visual Strategy Builder",
    description:
      "Design trading strategies using drag-and-drop nodes for indicators, conditions, AI agents, and execution logic.",
    href: "/",
    cta: "Learn more",
    status: "Live",
    statusTone: "live" as const,
    background: (
      <div className="relative h-36 overflow-hidden border-b border-neutral-800/70 bg-gradient-to-b from-neutral-900/90 to-transparent">
        <WorkflowNodePreview
          kind="condition"
          title="RSI(14) < 30 AND EMA20 > EMA50"
          subtitle="Branch true/false paths like the real builder canvas."
          badges={["5m", "15m"]}
        />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-[#151515] to-transparent" />
      </div>
    ),
    className: "lg:col-start-1 lg:col-end-2 lg:row-start-1 lg:row-end-2",
  },
  {
    Icon: GlobeIcon,
    name: "AI Chat Builder",
    description:
      "Generate trading workflows by conversing with our AI assistant. Describe your strategy and let AI build and optimize it for you.",
    href: "/create/ai-chat",
    cta: "Start building",
    status: "Beta",
    statusTone: "beta" as const,
    background: (
      <AIChatPreview />
    ),
    className: "lg:col-start-1 lg:col-end-2 lg:row-start-2 lg:row-end-3",
  },
  {
    Icon: CalendarIcon,
    name: "Backtesting & Simulation",
    description:
      "Test strategies against historical data with performance metrics and visualizations.",
    href: "/",
    cta: "Learn more",
    status: "Coming Soon",
    statusTone: "coming-soon" as const,
    background: (
      <BacktestPreview />
    ),
    className: "lg:col-start-3 lg:col-end-4 lg:row-start-1 lg:row-end-2",
  },
]
