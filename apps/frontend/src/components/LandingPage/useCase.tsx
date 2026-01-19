import { BentoGrid, BentoGridItem } from "../ui/bento-grid"
import {
  IconClipboardCopy,
  IconFileBroken,
  IconSignature,
  IconTableColumn,
} from "@tabler/icons-react";

export const UseCase = () => {
    return (
        <div className="mx-20 border border-neutral-800 pb-8">
            <div className="h-auto mt-20">
                <div className="text-center pb-8">
                    <h1 className="text-[#f17463] font-normal text-md">Use Cases</h1>
                    <h2 className="text-3xl font-medium tracking-tight text-gray-300 mt-6 max-w-lg mx-auto">Across Modern Trading Workflows</h2>
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

const Skeleton = () => (
  <div className="flex flex-1 w-full h-full min-h-[6rem] rounded-xl   bg-dot-white/[0.2] bg-dot-black/[0.2] [mask-image:radial-gradient(ellipse_at_center,white,transparent)]  border border-white/[0.2] bg-black"></div>
);
const items = [
  {
    title: "Strategy Research",
    description: "Build and experiment with trading logic using indicators, conditions, and AI agents.",
    header: <Skeleton />,
    className: "md:col-span-2",
    icon: <IconClipboardCopy className="h-4 w-4 text-neutral-500" />,
  },
  {
    title: "Backtesting & Validation",
    description: "Test strategies on historical market data before deploying them live.",
    header: <Skeleton />,
    className: "md:col-span-1",
    icon: <IconFileBroken className="h-4 w-4 text-neutral-500" />,
  },
  {
    title: "Automated Execution",
    description: "Execute trades automatically through broker integrations with defined risk controls.",
    header: <Skeleton />,
    className: "md:col-span-1",
    icon: <IconSignature className="h-4 w-4 text-neutral-500" />,
  },
  {
    title: "Options & F&O Strategies",
    description:
      "Model complex options, spreads, and derivatives workflows visually.",
    header: <Skeleton />,
    className: "md:col-span-2",
    icon: <IconTableColumn className="h-4 w-4 text-neutral-500" />,
  },
];