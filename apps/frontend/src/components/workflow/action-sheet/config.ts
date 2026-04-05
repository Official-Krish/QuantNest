import type { BuilderPanelGroup } from "@quantnest-trading/node-registry";
import type { ComponentType } from "react";
import {
  Bell,
  Clock3,
  FileText,
  Filter,
  GitBranch,
  GitFork,
  GitMerge,
  PlayCircle,
} from "lucide-react";

export const ACTION_GROUP_OPTIONS: Array<{
  id: BuilderPanelGroup;
  title: string;
  description: string;
  icon: ComponentType<{ className?: string }>;
  toneClassName: string;
}> = [
  {
    id: "Order Execution" as BuilderPanelGroup,
    title: "Order Execution",
    description: "Execute live orders through your broker integrations.",
    icon: PlayCircle,
    toneClassName: "text-[#ff9b8e]",
  },
  {
    id: "Order Notification" as BuilderPanelGroup,
    title: "Order Notification",
    description: "Send trade and workflow updates to chat or email.",
    icon: Bell,
    toneClassName: "text-[#f6b36a]",
  },
  {
    id: "Flow Control" as BuilderPanelGroup,
    title: "Flow Control",
    description: "Add branching, delays, and logic to your graph.",
    icon: GitBranch,
    toneClassName: "text-[#f17463]",
  },
  {
    id: "Reporting" as BuilderPanelGroup,
    title: "Reporting",
    description: "Generate reports and documentation artifacts.",
    icon: FileText,
    toneClassName: "text-neutral-200",
  },
];

export const ACTION_STEP_TITLES: Record<BuilderPanelGroup, string> = {
  "Order Execution": "Select broker",
  "Order Notification": "Select service",
  "Flow Control": "Select logic step",
  Reporting: "Select reporting action",
};

export const FLOW_CONTROL_STEP_OPTIONS: Record<
  string,
  {
    icon: ComponentType<{ className?: string }>;
    subtitle: string;
    toneClassName: string;
  }
> = {
  if: {
    icon: GitFork,
    subtitle: "Branch on condition",
    toneClassName: "text-[#ff9b8e]",
  },
  filter: {
    icon: Filter,
    subtitle: "Skip if false",
    toneClassName: "text-[#f6b36a]",
  },
  delay: {
    icon: Clock3,
    subtitle: "Wait before next",
    toneClassName: "text-[#ffb8ad]",
  },
  merge: {
    icon: GitMerge,
    subtitle: "Rejoin branches",
    toneClassName: "text-neutral-200",
  },
};

export function getSelectedCardTitle(group?: BuilderPanelGroup) {
  if (!group) return "Select service";
  return ACTION_STEP_TITLES[group];
}
