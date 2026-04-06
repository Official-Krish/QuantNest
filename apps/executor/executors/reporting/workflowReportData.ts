import type { NodeType } from "../../types";
import {
  getZerodhaTradeSummary,
  getZerodhaTradesForCsv,
  type ZerodhaTradeCsvRow,
  type ZerodhaTradeSummary,
} from "./zerodhaReportData";
import {
  getLighterTradeSummary,
  getLighterTradesForCsv,
} from "./lighterReportData";
import {
  getGrowwTradeSummary,
  getGrowwTradesForCsv,
} from "./growwReportData";

function hasAction(nodes: NodeType[], actionType: string): boolean {
  return nodes.some(
    (node) =>
      String(node.data?.kind || "").toLowerCase() === "action" &&
      String(node.type || "").toLowerCase() === actionType,
  );
}

export async function getWorkflowTradeSummary(input: {
  workflowId: string;
  userId: string;
  nodes: NodeType[];
}): Promise<ZerodhaTradeSummary> {
  if (hasAction(input.nodes, "zerodha")) {
    return getZerodhaTradeSummary(input);
  }

  if (hasAction(input.nodes, "groww")) {
    return getGrowwTradeSummary(input);
  }

  if (hasAction(input.nodes, "lighter")) {
    return getLighterTradeSummary(input);
  }

  throw new Error("Daily reporting requires a Zerodha, Groww, or Lighter action node in the workflow.");
}

export async function getWorkflowTradesForCsv(input: {
  workflowId: string;
  userId: string;
  nodes: NodeType[];
}): Promise<ZerodhaTradeCsvRow[]> {
  if (hasAction(input.nodes, "zerodha")) {
    return getZerodhaTradesForCsv(input);
  }

  if (hasAction(input.nodes, "groww")) {
    return getGrowwTradesForCsv(input);
  }

  if (hasAction(input.nodes, "lighter")) {
    return getLighterTradesForCsv(input);
  }

  throw new Error("CSV reporting requires a Zerodha, Groww, or Lighter action node in the workflow.");
}
