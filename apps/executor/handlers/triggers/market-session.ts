import type { TriggerEvaluationSnapshot } from "@quantnest-trading/types";
import type { IWorkflowHandler } from "../../processors/types";
import type { NodeType, WorkflowType } from "../../types";

export async function handleMarketSessionTrigger(
  event:
    | "market-open"
    | "market-close"
    | "at-time"
    | "pause-at-time"
    | "session-window",
  lastTriggeredAt: Date | null | undefined,
  lastEvaluatedAt: Date | null | undefined,
  triggerTime?: string,
  endTime?: string,
  marketType?: string,
): Promise<{ shouldExecute: boolean; snapshot: TriggerEvaluationSnapshot }> {
  const now = new Date();
  const istTime = new Date(
    now.toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }),
  );
  const currentHours = istTime.getHours();
  const currentMinutes = istTime.getMinutes();
  const currentTimeInMinutes = currentHours * 60 + currentMinutes;
  const normalizedMarketType = String(marketType || "indian")
    .trim()
    .toLowerCase();
  const isCryptoMarket =
    normalizedMarketType === "crypto" || normalizedMarketType === "web3";

  const snapshot: TriggerEvaluationSnapshot = {
    triggerType: "market-session",
    sessionEvent: event,
    marketType: normalizedMarketType,
    sessionTriggered: false,
  };

  void lastEvaluatedAt;

  if (event === "market-open") {
    const marketOpenTimeMinutes = isCryptoMarket ? 0 : 9 * 60 + 15;
    const wasNotTriggeredToday =
      !lastTriggeredAt ||
      lastTriggeredAt.toDateString() !== istTime.toDateString();
    const isNowAfterOpen = currentTimeInMinutes >= marketOpenTimeMinutes;
    const isWithinGraceWindow =
      currentTimeInMinutes < marketOpenTimeMinutes + 1;
    const shouldExecute =
      wasNotTriggeredToday && isNowAfterOpen && isWithinGraceWindow;
    snapshot.sessionTriggered = shouldExecute;
    return { shouldExecute, snapshot };
  }

  if (event === "market-close") {
    const marketCloseTimeMinutes = isCryptoMarket ? 23 * 60 + 59 : 15 * 60 + 30;
    const wasNotTriggeredToday =
      !lastTriggeredAt ||
      lastTriggeredAt.toDateString() !== istTime.toDateString();
    const isNowAfterClose = currentTimeInMinutes >= marketCloseTimeMinutes;
    const isWithinGraceWindow =
      currentTimeInMinutes < marketCloseTimeMinutes + 1;
    const shouldExecute =
      wasNotTriggeredToday && isNowAfterClose && isWithinGraceWindow;
    snapshot.sessionTriggered = shouldExecute;
    return { shouldExecute, snapshot };
  }

  if ((event === "at-time" || event === "pause-at-time") && triggerTime) {
    const triggerParts = triggerTime.split(":");
    if (triggerParts.length !== 2) {
      return { shouldExecute: false, snapshot };
    }

    const triggerHours = Number(triggerParts[0]);
    const triggerMinutes = Number(triggerParts[1]);
    if (!Number.isFinite(triggerHours) || !Number.isFinite(triggerMinutes)) {
      return { shouldExecute: false, snapshot };
    }
    if (
      triggerHours < 0 ||
      triggerHours > 23 ||
      triggerMinutes < 0 ||
      triggerMinutes > 59
    ) {
      return { shouldExecute: false, snapshot };
    }

    const triggerTimeInMinutes = triggerHours * 60 + triggerMinutes;
    const wasNotTriggeredToday =
      !lastTriggeredAt ||
      lastTriggeredAt.toDateString() !== istTime.toDateString();
    const isNowAfterTrigger = currentTimeInMinutes >= triggerTimeInMinutes;
    const isWithinGraceWindow = currentTimeInMinutes < triggerTimeInMinutes + 1;
    const shouldExecute =
      wasNotTriggeredToday && isNowAfterTrigger && isWithinGraceWindow;
    snapshot.sessionTriggered = shouldExecute;
    return { shouldExecute, snapshot };
  }

  if (event === "session-window" && triggerTime && endTime) {
    const parseTime = (value: string): number | null => {
      const parts = value.split(":");
      if (parts.length !== 2) return null;

      const hours = Number(parts[0]);
      const minutes = Number(parts[1]);
      if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return null;
      if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return null;

      return hours * 60 + minutes;
    };

    const startMinutes = parseTime(triggerTime);
    const endMinutes = parseTime(endTime);
    if (startMinutes === null || endMinutes === null) {
      return { shouldExecute: false, snapshot };
    }

    const isWithinWindow =
      startMinutes <= endMinutes
        ? currentTimeInMinutes >= startMinutes &&
          currentTimeInMinutes < endMinutes
        : currentTimeInMinutes >= startMinutes ||
          currentTimeInMinutes < endMinutes;

    snapshot.sessionTriggered = isWithinWindow;
    return { shouldExecute: isWithinWindow, snapshot };
  }

  return { shouldExecute: false, snapshot };
}

export const marketSessionHandler: IWorkflowHandler = {
  async evaluate(workflow: WorkflowType, trigger: NodeType) {
    const event = String(
      trigger.data?.metadata?.event || "market-open",
    ).toLowerCase() as
      | "market-open"
      | "market-close"
      | "at-time"
      | "pause-at-time"
      | "session-window";

    const { shouldExecute, snapshot } = await handleMarketSessionTrigger(
      event,
      workflow.lastTriggeredAt ?? null,
      workflow.lastEvaluatedAt ?? null,
      trigger.data?.metadata?.triggerTime as string | undefined,
      trigger.data?.metadata?.endTime as string | undefined,
      trigger.data?.metadata?.marketType as string | undefined,
    );

    const isPauseEvent = shouldExecute && event === "pause-at-time";

    return {
      shouldExecute,
      snapshot,
      skipEnqueue: isPauseEvent,
      extraUpdates: isPauseEvent ? { status: "paused" } : undefined,
    };
  },
};
