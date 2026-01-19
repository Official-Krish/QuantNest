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

export const Features = () => {
    return (
      <div className="border-y border-neutral-800">
        <div className="mx-20 border border-neutral-800 bg-black">
          <div className="py-20 flex justify-center items-center border-b border-neutral-800 px-4">
            <div className="text-center">
              <h2 className="text-md font-normal text-[#f17463]">Features</h2>
              <h1 className="text-2xl font-medium tracking-tight md:text-3xl lg:text-4xl text-neutral-100 mt-4">Built for Intelligent Trading Automation</h1>
              <h3 className="text-sm font-medium tracking-tight md:text-sm lg:text-base text-gray-300 mx-auto mt-6 max-w-lg px-2">Design, test, and deploy AI-powered trading strategies using a visual, workflow-based interface.</h3>
            </div>
          </div>
          <div className="py-10 flex justify-center items-center px-4">
            <BentoGrid className="lg:grid-rows-3">
                {features.map((feature) => (
                    <BentoCard key={feature.name} {...feature}/>
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
  },
  {
    name: "Trade Executed",
    message: "Your order to buy 100 shares of TSLA has been executed.",
    time: "15m",
  },
  {
    name: "Stop Loss Hit",
    message: "Your stop loss for GOOGL has been triggered at $2,500.",
    time: "30m",
  },
  {
    name: "Margin Call",
    message: "Your account has fallen below the required margin level.",
    time: "1h",
  },
  {
    name: "Dividend Received",
    message: "You have received a dividend payment from MSFT.",
    time: "2h",
  }
] 

const features = [
  {
    Icon: FileTextIcon,
    name: "Multi-Market Support",
    description:
      "Trade across equities, F&O, and upcoming Web3 protocols from a single workflow.",
    href: "/",
    cta: "Learn more",
    background: <img className="absolute -top-20 -right-20 opacity-60" />,
    className: "lg:col-start-3 lg:col-end-3 lg:row-start-2 lg:row-end-4",
  },
  {
    Icon: BellIcon,
    name: "Notification Feed",
    description: "Stay updated with real-time alerts on trade executions, price movements, and strategy performance.",
    href: "/",
    cta: "Learn more",
    background: <AnimatedList>
        {notifications.map((notification, index) => (
          <NotificationCard
            key={index}
            name={notification.name}
            message={notification.message}
            time={notification.time}
          />
        ))}
      </AnimatedList>,
    className: "lg:row-start-1 lg:row-end-4 lg:col-start-2 lg:col-end-3",
  },
  {
    Icon: InputIcon,
    name: "Visual Strategy Builder",
    description: "Design trading strategies using drag-and-drop nodes for indicators, conditions, AI agents, and execution logic.",
    href: "/",
    cta: "Learn more",
    background: <img className="absolute -top-20 -right-20 opacity-60" />,
    className: "lg:col-start-1 lg:col-end-2 lg:row-start-1 lg:row-end-3",
  },
  {
    Icon: GlobeIcon,
    name: "AI Decision Agents",
    description: "Use AI agents for market analysis, signal generation, risk checks, and trade validation.",
    href: "/",
    cta: "Learn more",
    background: <img className="absolute -top-20 -right-20 opacity-60" />,
    className: "lg:col-start-1 lg:col-end-2 lg:row-start-3 lg:row-end-4",
  },
  {
    Icon: CalendarIcon,
    name: "Backtesting & Simulation",
    description: "Test strategies against historical data with performance metrics and visualizations.",
    href: "/",
    cta: "Learn more",
    background: <img className="absolute -top-20 -right-20 opacity-60" />,
    className: "lg:col-start-3 lg:col-end-3 lg:row-start-1 lg:row-end-2",
  },
  
]