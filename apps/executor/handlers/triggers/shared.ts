import { SUPPORTED_INDIAN_MARKET_ASSETS, SUPPORTED_WEB3_ASSETS } from "@quantnest-trading/types";

export function getChartIntervalForWindow(windowMinutes: number): "1m" | "2m" | "5m" | "15m" | "60m" {
  if (windowMinutes <= 30) return "1m";
  if (windowMinutes <= 60) return "2m";
  if (windowMinutes <= 180) return "5m";
  if (windowMinutes <= 720) return "15m";
  return "60m";
}

export function normalizeTriggerMarket(marketType: unknown, fallback = "Indian"): "Indian" | "Crypto" {
  const normalized = String(marketType || fallback).toLowerCase();
  return normalized === "crypto" || normalized === "web3" ? "Crypto" : "Indian";
}

export function getRetestToleranceValue(level: number, tolerancePct: number): number {
  return (Math.abs(level) * tolerancePct) / 100;
}

export function getConfirmationMoveValue(level: number, confirmationMovePct: number): number {
  return (Math.abs(level) * confirmationMovePct) / 100;
}

export function isSupportedAssetForMarket(asset: string, market: "Indian" | "Crypto") {
  if (market === "Indian") {
    return SUPPORTED_INDIAN_MARKET_ASSETS.includes(asset as string);
  }
  return SUPPORTED_WEB3_ASSETS.includes(asset as string);
}
