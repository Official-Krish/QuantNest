import type { ConditionalTriggerMetadata, IndicatorConditionGroup } from "@quantnest-trading/types";
import { SUPPORTED_INDIAN_MARKET_ASSETS, SUPPORTED_WEB3_ASSETS } from "@quantnest-trading/types";
import { getCurrentPrice, getHistoricalChart } from "@quantnest-trading/market";
import type { NodeType, WorkflowType } from "../types";
import { indicatorEngine } from "../services/indicator.engine";

function getChartIntervalForWindow(windowMinutes: number): "1m" | "2m" | "5m" | "15m" | "60m" {
    if (windowMinutes <= 30) return "1m";
    if (windowMinutes <= 60) return "2m";
    if (windowMinutes <= 180) return "5m";
    if (windowMinutes <= 720) return "15m";
    return "60m";
}

function normalizeTriggerMarket(marketType: unknown, fallback = "Indian"): "Indian" | "Crypto" {
    const normalized = String(marketType || fallback).toLowerCase();
    return normalized === "crypto" || normalized === "web3" ? "Crypto" : "Indian";
}

function getRetestToleranceValue(level: number, tolerancePct: number): number {
    return (Math.abs(level) * tolerancePct) / 100;
}

function getConfirmationMoveValue(level: number, confirmationMovePct: number): number {
    return (Math.abs(level) * confirmationMovePct) / 100;
}

export async function handlePriceTrigger(
    workflow: WorkflowType,
    trigger: NodeType
): Promise<boolean> {
    const {
        condition,
        targetPrice,
        asset,
        marketType,
        mode,
        changeType,
        changeDirection,
        changeValue,
        changeWindowMinutes,
    } = trigger.data?.metadata || {};

    if (!asset) {
        console.error("Invalid price trigger metadata");
        return false;
    }

    const market = normalizeTriggerMarket(marketType || workflow.nodes[0]?.data?.metadata?.marketType || "Indian");
    const normalizedAsset = String(asset).trim();

    if (
        (market === "Indian" && !SUPPORTED_INDIAN_MARKET_ASSETS.includes(normalizedAsset as string)) ||
        (market === "Crypto" && !SUPPORTED_WEB3_ASSETS.includes(normalizedAsset as string))
    ) {
        console.error(`Unsupported asset ${normalizedAsset}`);
        return false;
    }

    const currentPrice = await getCurrentPrice(normalizedAsset, market);

    if (mode === "change") {
        const normalizedDirection = String(changeDirection || "").toLowerCase();
        const normalizedType = String(changeType || "").toLowerCase();
        const requiredChange = Number(changeValue);
        const windowMinutes = Number(changeWindowMinutes);

        if (
            !["increase", "decrease"].includes(normalizedDirection) ||
            !["absolute", "percent"].includes(normalizedType) ||
            !Number.isFinite(requiredChange) ||
            requiredChange <= 0 ||
            !Number.isFinite(windowMinutes) ||
            windowMinutes <= 0
        ) {
            console.error("Invalid price-change trigger metadata");
            return false;
        }

        const periodStart = new Date(Date.now() - windowMinutes * 60 * 1000);
        const candles = await getHistoricalChart(
            normalizedAsset,
            market,
            periodStart,
            getChartIntervalForWindow(windowMinutes),
        );

        const baselineCandle = candles.find((candle) => typeof candle?.close === "number" && Number.isFinite(candle.close));
        const baselinePriceRaw = baselineCandle?.close;
        if (typeof baselinePriceRaw !== "number" || !Number.isFinite(baselinePriceRaw) || baselinePriceRaw <= 0) {
            return false;
        }

        const baselinePrice = baselinePriceRaw;

        const delta = currentPrice - baselinePrice;
        const directionalMatch = normalizedDirection === "increase" ? delta >= 0 : delta <= 0;
        if (!directionalMatch) {
            return false;
        }

        const magnitude = Math.abs(delta);
        const observedChange = normalizedType === "percent"
            ? (magnitude / baselinePrice) * 100
            : magnitude;

        return observedChange >= requiredChange;
    }

    if (!condition || typeof targetPrice !== "number") {
        console.error("Invalid threshold price trigger metadata");
        return false;
    }

    if (condition === "above") {
        return currentPrice > targetPrice;
    }

    if (condition === "below") {
        return currentPrice < targetPrice;
    }

    return false;
}

export async function handleBreakoutRetestTrigger(
    workflow: WorkflowType,
    trigger: NodeType,
): Promise<{
    shouldExecute: boolean;
    runtime: {
        stage: "idle" | "broken-out" | "retested" | "confirmed";
        breakoutDetectedAt?: string;
        retestDetectedAt?: string;
        breakoutPrice?: number;
        retestPrice?: number;
    };
    currentPrice: number;
}> {
    const {
        asset,
        marketType,
        direction,
        breakoutLevel,
        retestTolerancePct,
        confirmationMovePct,
        retestWindowMinutes,
        confirmationWindowMinutes,
    } = trigger.data?.metadata || {};

    if (!asset || !Number.isFinite(Number(breakoutLevel))) {
        throw new Error("Invalid breakout retest trigger metadata");
    }

    const normalizedAsset = String(asset).trim();
    const market = normalizeTriggerMarket(marketType || workflow.nodes[0]?.data?.metadata?.marketType || "Indian");
    const normalizedDirection = String(direction || "").toLowerCase();

    if (
        (market === "Indian" && !SUPPORTED_INDIAN_MARKET_ASSETS.includes(normalizedAsset as string)) ||
        (market === "Crypto" && !SUPPORTED_WEB3_ASSETS.includes(normalizedAsset as string))
    ) {
        throw new Error(`Unsupported asset ${normalizedAsset}`);
    }

    if (!["bullish", "bearish"].includes(normalizedDirection)) {
        throw new Error("Breakout retest direction must be bullish or bearish");
    }

    const level = Number(breakoutLevel);
    const tolerancePct = Number(retestTolerancePct);
    const confirmationPct = Number(confirmationMovePct);
    const retestWindow = Number(retestWindowMinutes);
    const confirmationWindow = Number(confirmationWindowMinutes);

    if (
        !Number.isFinite(tolerancePct) ||
        tolerancePct <= 0 ||
        !Number.isFinite(confirmationPct) ||
        confirmationPct <= 0 ||
        !Number.isFinite(retestWindow) ||
        retestWindow <= 0 ||
        !Number.isFinite(confirmationWindow) ||
        confirmationWindow <= 0
    ) {
        throw new Error("Breakout retest windows and percentages must be greater than zero");
    }

    const currentPrice = await getCurrentPrice(normalizedAsset, market);
    const toleranceValue = getRetestToleranceValue(level, tolerancePct);
    const confirmationMoveValue = getConfirmationMoveValue(level, confirmationPct);
    const now = new Date();

    const runtime = {
        stage: String(workflow.triggerConfig?.runtime?.stage || "idle") as "idle" | "broken-out" | "retested" | "confirmed",
        breakoutDetectedAt: workflow.triggerConfig?.runtime?.breakoutDetectedAt
            ? new Date(workflow.triggerConfig.runtime.breakoutDetectedAt as string | Date).toISOString()
            : undefined,
        retestDetectedAt: workflow.triggerConfig?.runtime?.retestDetectedAt
            ? new Date(workflow.triggerConfig.runtime.retestDetectedAt as string | Date).toISOString()
            : undefined,
        breakoutPrice: typeof workflow.triggerConfig?.runtime?.breakoutPrice === "number"
            ? Number(workflow.triggerConfig.runtime.breakoutPrice)
            : undefined,
        retestPrice: typeof workflow.triggerConfig?.runtime?.retestPrice === "number"
            ? Number(workflow.triggerConfig.runtime.retestPrice)
            : undefined,
    };

    const resetRuntime = () => ({
        stage: "idle" as const,
        breakoutDetectedAt: undefined,
        retestDetectedAt: undefined,
        breakoutPrice: undefined,
        retestPrice: undefined,
    });

    const isBreakout = normalizedDirection === "bullish"
        ? currentPrice > level
        : currentPrice < level;
    const isInRetestZone = currentPrice >= level - toleranceValue && currentPrice <= level + toleranceValue;
    const isConfirmed = normalizedDirection === "bullish"
        ? currentPrice >= level + confirmationMoveValue
        : currentPrice <= level - confirmationMoveValue;

    if (runtime.stage === "broken-out" && runtime.breakoutDetectedAt) {
        const expiresAt = new Date(runtime.breakoutDetectedAt).getTime() + retestWindow * 60 * 1000;
        if (Date.now() > expiresAt) {
            Object.assign(runtime, resetRuntime());
        }
    }

    if (runtime.stage === "retested" && runtime.retestDetectedAt) {
        const expiresAt = new Date(runtime.retestDetectedAt).getTime() + confirmationWindow * 60 * 1000;
        if (Date.now() > expiresAt) {
            Object.assign(runtime, resetRuntime());
        }
    }

    if (runtime.stage === "idle" && isBreakout) {
        runtime.stage = "broken-out";
        runtime.breakoutDetectedAt = now.toISOString();
        runtime.breakoutPrice = currentPrice;
    }

    if (runtime.stage === "broken-out" && isInRetestZone) {
        runtime.stage = "retested";
        runtime.retestDetectedAt = now.toISOString();
        runtime.retestPrice = currentPrice;
    }

    if (runtime.stage === "retested" && isConfirmed) {
        runtime.stage = "confirmed";
        return {
            shouldExecute: true,
            runtime,
            currentPrice,
        };
    }

    return {
        shouldExecute: false,
        runtime,
        currentPrice,
    };
}

export async function handleTimerTrigger(
    lastExecutionTime: number | null,
    interval: number
): Promise<boolean> {
    if (!lastExecutionTime) return true;
    return lastExecutionTime + interval * 1000 < Date.now();
}

export async function handleConditionalTrigger(timeWindowMinutes?: number, startTime?: Date): Promise<boolean> {
    if (!timeWindowMinutes || !startTime) {
        return true;
    }
    const now = Date.now();
    const start = startTime.getTime();
    return now >= start && now <= start + timeWindowMinutes * 60 * 1000;   
}

export async function checkCondition(targetPrice: number, marketType: "Indian" | "Crypto", asset: string, condition: "above" | "below"): Promise<boolean> {
    const currentPrice = await getCurrentPrice(asset, marketType);
    if (condition === "above") {
        return currentPrice > targetPrice;
    } else {
        return currentPrice < targetPrice;
    }   
}

export async function evaluateConditionalMetadata(metadata?: ConditionalTriggerMetadata): Promise<boolean> {
    if (!metadata) {
        return false;
    }

    const expression = metadata.expression as IndicatorConditionGroup | undefined;
    if (expression) {
        indicatorEngine.registerExpression(expression);
        return indicatorEngine.evaluateExpression(expression);
    }

    if (
        typeof metadata.targetPrice === "number" &&
        typeof metadata.asset === "string" &&
        (metadata.condition === "above" || metadata.condition === "below")
    ) {
        return checkCondition(
            metadata.targetPrice,
            (metadata.marketType === "Crypto" || metadata.marketType === "web3") ? "Crypto" : "Indian",
            metadata.asset,
            metadata.condition
        );
    }

    return false;
}

export async function handleMarketSessionTrigger(
    event: "market-open" | "market-close" | "at-time" | "pause-at-time" | "session-window",
    lastTriggeredAt: Date | null | undefined,
    lastEvaluatedAt: Date | null | undefined,
    triggerTime?: string, // HH:MM format for at-time events
    endTime?: string, // HH:MM format for session-window events
    marketType?: string,
): Promise<boolean> {
    const now = new Date();
    const istTime = new Date(now.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }));
    const currentHours = istTime.getHours();
    const currentMinutes = istTime.getMinutes();
    const currentTimeInMinutes = currentHours * 60 + currentMinutes;
    const normalizedMarketType = String(marketType || "indian").trim().toLowerCase();
    const isCryptoMarket = normalizedMarketType === "crypto" || normalizedMarketType === "web3";

    void lastEvaluatedAt;

    if (event === "market-open") {
        const marketOpenTimeMinutes = isCryptoMarket ? 0 : 9 * 60 + 15;
        const wasNotTriggeredToday = !lastTriggeredAt || lastTriggeredAt.toDateString() !== istTime.toDateString();
        const isNowAfterOpen = currentTimeInMinutes >= marketOpenTimeMinutes;
        const isWithinGraceWindow = currentTimeInMinutes < marketOpenTimeMinutes + 1; // 1 minute grace

        return wasNotTriggeredToday && isNowAfterOpen && isWithinGraceWindow;
    }

    if (event === "market-close") {
        const marketCloseTimeMinutes = isCryptoMarket ? (23 * 60 + 59) : (15 * 60 + 30);
        const wasNotTriggeredToday = !lastTriggeredAt || lastTriggeredAt.toDateString() !== istTime.toDateString();
        const isNowAfterClose = currentTimeInMinutes >= marketCloseTimeMinutes;
        const isWithinGraceWindow = currentTimeInMinutes < marketCloseTimeMinutes + 1; // 1 minute grace

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
        const wasNotTriggeredToday = !lastTriggeredAt || lastTriggeredAt.toDateString() !== istTime.toDateString();
        const isNowAfterTrigger = currentTimeInMinutes >= triggerTimeInMinutes;
        const isWithinGraceWindow = currentTimeInMinutes < triggerTimeInMinutes + 1; // 1 minute grace

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

        const isWithinWindow = startMinutes <= endMinutes
            ? currentTimeInMinutes >= startMinutes && currentTimeInMinutes < endMinutes
            : currentTimeInMinutes >= startMinutes || currentTimeInMinutes < endMinutes;

        return isWithinWindow;
    }

    return false;
}
