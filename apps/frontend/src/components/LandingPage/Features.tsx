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
          <BentoGrid className="lg:grid-rows-3">
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
  }
] 

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
      <WorkflowNodePreview
        kind="action"
        title="Execute on Zerodha / Groww"
        subtitle="Route the same strategy to multiple broker actions."
        badges={["IND", "F&O"]}
      />
    ),
    className: "lg:col-start-3 lg:col-end-3 lg:row-start-2 lg:row-end-4",
  },
  {
    Icon: BellIcon,
    name: "Notification Feed",
    description:
      "Stay updated with real-time alerts on trade executions, price movements, and strategy performance.",
    href: "/",
    cta: "Learn more",
    status: "Live",
    statusTone: "live" as const,
    background: (
      <div ref={notificationRef} className="h-full w-full">
        <AnimatedList
          isActive={notificationsActive}
          delay={1200}
          className="items-start"
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
      </div>
    ),
    className:
      "lg:row-start-1 lg:row-end-4 lg:col-start-2 lg:col-end-3 border border-neutral-800/60 bg-neutral-900/40",
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
      <WorkflowNodePreview
        kind="condition"
        title="RSI(14) < 30 AND EMA20 > EMA50"
        subtitle="Branch true/false paths like the real builder canvas."
        badges={["5m", "15m"]}
      />
    ),
    className: "lg:col-start-1 lg:col-end-2 lg:row-start-1 lg:row-end-3",
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
    background: <img className="absolute -top-20 -right-20 opacity-60" />,
    className: "lg:col-start-1 lg:col-end-2 lg:row-start-3 lg:row-end-4",
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
    background: <img className="absolute -top-20 -right-20 opacity-60" />,
    className: "lg:col-start-3 lg:col-end-3 lg:row-start-1 lg:row-end-2",
  },
]
