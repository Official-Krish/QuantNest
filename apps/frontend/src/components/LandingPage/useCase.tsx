import { BentoGrid, BentoGridItem } from "../ui/bento-grid"
import {
  IconClipboardCopy,
  IconFileBroken,
  IconSignature,
  IconTableColumn,
} from "@tabler/icons-react"

import { UseCaseSkeleton } from "./UseCaseSkeleton"

export const UseCase = () => {
    return (
        <div className="mx-20 border border-neutral-800 pb-8">
            <div className="h-auto mt-20">
                <div className="text-center pb-8">
                    <h1 className="text-[#f17463] font-normal text-md">Use Cases</h1>
                    <h2 className="text-3xl font-medium tracking-tight text-gray-300 mt-6 max-w-lg mx-auto">From research to live execution</h2>
                    <h3 className="text-lg font-medium tracking-tight text-gray-300 mt-6 max-w-lg mx-auto">Build visual trading workflows for research simulation and live execution</h3>
                </div>
                <BentoGrid className="max-w-4xl mx-auto md:auto-rows-[20rem]">
                    {items.map((item, i) => (
                        <BentoGridItem
                            key={i}
                            title={item.title}
                            description={item.description}
                            header={item.header}
                            className={item.className}
                            icon={item.icon}
                        />
                    ))}
                </BentoGrid>
            </div>
        </div>
    )
}

const items = [
  {
    title: "Strategy Research",
    description: "Build and experiment with trading logic using indicators, conditions, and AI agents.",
    header: <UseCaseSkeleton variant="research" />,
    className: "md:col-span-2",
    icon: <IconClipboardCopy className="h-5 w-5 text-neutral-500" />,
  },
  {
    title: "Backtesting & Validation",
    description: "Test strategies on historical market data before deploying them live.",
    header: <UseCaseSkeleton variant="backtest" />,
    className: "md:col-span-1",
    icon: <IconFileBroken className="h-5 w-5 text-neutral-500" />,
  },
  {
    title: "Automated Execution",
    description: "Execute trades automatically through broker integrations with defined risk controls.",
    header: <UseCaseSkeleton variant="execution" />,
    className: "md:col-span-1",
    icon: <IconSignature className="h-5 w-5 text-neutral-500" />,
  },
  {
    title: "Options & F&O Strategies",
    description:
      "Model complex options, spreads, and derivatives workflows visually.",
    header: <UseCaseSkeleton variant="options" />,
    className: "md:col-span-2",
    icon: <IconTableColumn className="h-5 w-5 text-neutral-500" />,
  },
];