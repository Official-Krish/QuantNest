export async function handleMarketSessionTrigger(
  event: "market-open" | "market-close" | "at-time" | "pause-at-time" | "session-window",
  lastTriggeredAt: Date | null | undefined,
  lastEvaluatedAt: Date | null | undefined,
  triggerTime?: string,
  endTime?: string,
  marketType?: string,
): Promise<boolean> {
  const now = new Date();
  const istTime = new Date(now.toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }));
  const currentHours = istTime.getHours();
  const currentMinutes = istTime.getMinutes();
  const currentTimeInMinutes = currentHours * 60 + currentMinutes;
  const normalizedMarketType = String(marketType || "indian").trim().toLowerCase();
  const isCryptoMarket = normalizedMarketType === "crypto" || normalizedMarketType === "web3";

  void lastEvaluatedAt;

  if (event === "market-open") {
    const marketOpenTimeMinutes = isCryptoMarket ? 0 : 9 * 60 + 15;
    const wasNotTriggeredToday =
      !lastTriggeredAt || lastTriggeredAt.toDateString() !== istTime.toDateString();
    const isNowAfterOpen = currentTimeInMinutes >= marketOpenTimeMinutes;
    const isWithinGraceWindow = currentTimeInMinutes < marketOpenTimeMinutes + 1;
    return wasNotTriggeredToday && isNowAfterOpen && isWithinGraceWindow;
  }

  if (event === "market-close") {
    const marketCloseTimeMinutes = isCryptoMarket ? 23 * 60 + 59 : 15 * 60 + 30;
    const wasNotTriggeredToday =
      !lastTriggeredAt || lastTriggeredAt.toDateString() !== istTime.toDateString();
    const isNowAfterClose = currentTimeInMinutes >= marketCloseTimeMinutes;
    const isWithinGraceWindow = currentTimeInMinutes < marketCloseTimeMinutes + 1;
    return wasNotTriggeredToday && isNowAfterClose && isWithinGraceWindow;
  }

  if ((event === "at-time" || event === "pause-at-time") && triggerTime) {
    const triggerParts = triggerTime.split(":");
    if (triggerParts.length !== 2) {
      return false;
    }

    const triggerHours = Number(triggerParts[0]);
    const triggerMinutes = Number(triggerParts[1]);
    if (!Number.isFinite(triggerHours) || !Number.isFinite(triggerMinutes)) {
      return false;
    }
    if (triggerHours < 0 || triggerHours > 23 || triggerMinutes < 0 || triggerMinutes > 59) {
      return false;
    }

    const triggerTimeInMinutes = triggerHours * 60 + triggerMinutes;
    const wasNotTriggeredToday =
      !lastTriggeredAt || lastTriggeredAt.toDateString() !== istTime.toDateString();
    const isNowAfterTrigger = currentTimeInMinutes >= triggerTimeInMinutes;
    const isWithinGraceWindow = currentTimeInMinutes < triggerTimeInMinutes + 1;

    return wasNotTriggeredToday && isNowAfterTrigger && isWithinGraceWindow;
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
      return false;
    }

    const isWithinWindow =
      startMinutes <= endMinutes
        ? currentTimeInMinutes >= startMinutes && currentTimeInMinutes < endMinutes
        : currentTimeInMinutes >= startMinutes || currentTimeInMinutes < endMinutes;

    return isWithinWindow;
  }

  return false;
}
