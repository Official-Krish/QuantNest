import { getBuilderActionGroups, getBuilderTriggerOptions } from "@quantnest-trading/node-registry";

export const SUPPORTED_ACTIONS = getBuilderActionGroups();

export const SUPPORTED_TRIGGERS = getBuilderTriggerOptions();

export const EXCHANGES = [
  { value: "NSE", label: "NSE" },
  { value: "BSE", label: "BSE" },
  { value: "NFO", label: "NFO" },
  { value: "CDS", label: "CDS" },
  { value: "BCD", label: "BCD" },
  { value: "BFO", label: "BFO" },
  { value: "MCX", label: "MCX" },
] as const;
