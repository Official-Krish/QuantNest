import { getNodeRegistryEntry, type BuilderPanelGroup } from "@quantnest-trading/node-registry";
import { PriceTrigger } from "@/components/nodes/triggers/PriceTrigger";
import { Timer } from "@/components/nodes/triggers/timers";
import { conditionTrigger } from "@/components/nodes/triggers/condtional";
import { MarketSessionTrigger } from "@/components/nodes/triggers/MarketSessionTrigger";
import { zerodhaAction } from "@/components/nodes/actions/zerodha";
import { growwAction } from "@/components/nodes/actions/growwAction";
import { lighterAction } from "@/components/nodes/actions/lighterAction";
import { gmailAction } from "@/components/nodes/actions/gmailAction";
import { slackAction } from "@/components/nodes/actions/slackAction";
import { telegramAction } from "@/components/nodes/actions/telegramAction";
import { discordAction } from "@/components/nodes/actions/discordAction";
import { whatsappAction } from "@/components/nodes/actions/whatsappAction";
import { delayAction } from "@/components/nodes/actions/delayAction";
import { filterAction } from "@/components/nodes/actions/filterAction";
import { ifAction } from "@/components/nodes/actions/ifAction";
import { mergeAction } from "@/components/nodes/actions/mergeAction";
import { notionDailyReportAction } from "@/components/nodes/actions/notionDailyReportAction";
import { googleDriveDailyCsvAction } from "@/components/nodes/actions/googleDriveDailyCsvAction";
import { googleSheetsReportAction } from "@/components/nodes/actions/googleSheetsReportAction";
import { TimerForm } from "./sheets/TimerForm";
import { PriceTriggerForm } from "./sheets/PriceTriggerForm";
import { ConditionalTriggerForm } from "./sheets/CondtionalTriggerForm";
import { MarketSessionTriggerForm } from "./sheets/MarketSessionTriggerForm";
import { TradingForm } from "./sheets/TradingForm";
import { GmailForm } from "./sheets/GmailForm";
import { SlackForm } from "./sheets/SlackForm";
import { TelegramForm } from "./sheets/TelegramForm";
import { DiscordForm } from "./sheets/DiscordForm";
import { WhatsappForm } from "./sheets/WhatsappForm";
import { DelayForm } from "./sheets/DelayForm";
import { NotionDailyReportForm } from "./sheets/NotionDailyReportForm";
import { GoogleDriveDailyCsvForm } from "./sheets/GoogleDriveDailyCsvForm";
import { GoogleSheetsReportForm } from "./sheets/GoogleSheetsReportForm";
import type { NodeMetadata } from "@quantnest-trading/types";
import type { Dispatch, ReactNode, SetStateAction } from "react";

export interface BuilderFormRenderProps {
  metadata: NodeMetadata | {};
  setMetadata: Dispatch<SetStateAction<any>>;
  setMarketType?: Dispatch<SetStateAction<"Indian" | "Crypto" | null>>;
  marketType?: "Indian" | "Crypto" | null;
  showApiKey?: boolean;
  action?: string;
  selectedAction?: string;
}

export const builderNodeRenderers = {
  timer: Timer,
  "price-trigger": PriceTrigger,
  "conditional-trigger": conditionTrigger,
  "market-session": MarketSessionTrigger,
  zerodha: zerodhaAction,
  groww: growwAction,
  lighter: lighterAction,
  gmail: gmailAction,
  slack: slackAction,
  telegram: telegramAction,
  discord: discordAction,
  whatsapp: whatsappAction,
  delay: delayAction,
  filter: filterAction,
  if: ifAction,
  merge: mergeAction,
  "notion-daily-report": notionDailyReportAction,
  "google-drive-daily-csv": googleDriveDailyCsvAction,
  "google-sheets-report": googleSheetsReportAction,
} as const;

export const builderFormRegistry = {
  timer: TimerForm,
  "price-trigger": PriceTriggerForm,
  conditional: ConditionalTriggerForm,
  "market-session": MarketSessionTriggerForm,
  trading: TradingForm,
  gmail: GmailForm,
  slack: SlackForm,
  telegram: TelegramForm,
  discord: DiscordForm,
  whatsapp: WhatsappForm,
  delay: DelayForm,
  "notion-daily-report": NotionDailyReportForm,
  "google-drive-daily-csv": GoogleDriveDailyCsvForm,
  "google-sheets-report": GoogleSheetsReportForm,
} as const;

export function getBuilderFormComponent(nodeType: string) {
  const formId = getNodeRegistryEntry(nodeType)?.builderFormId;
  if (!formId || formId === "none") {
    return null;
  }

  return builderFormRegistry[formId];
}

export function renderBuilderForm(nodeType: string, props: BuilderFormRenderProps): ReactNode {
  const formId = getNodeRegistryEntry(nodeType)?.builderFormId;
  if (!formId || formId === "none") {
    return null;
  }

  switch (formId) {
    case "trading":
      return (
        <TradingForm
          metadata={props.metadata as any}
          setMetadata={props.setMetadata}
          showApiKey={props.showApiKey}
          action={(props.action || props.selectedAction) as "zerodha" | "groww" | "lighter"}
        />
      );
    case "timer":
      return (
        <TimerForm
          metadata={props.metadata as any}
          setMetadata={props.setMetadata}
          setMarketType={props.setMarketType!}
          marketType={props.marketType ?? null}
        />
      );
    case "price-trigger":
      return (
        <PriceTriggerForm
          metadata={props.metadata as any}
          setMetadata={props.setMetadata}
          setMarketType={props.setMarketType!}
          marketType={props.marketType ?? null}
        />
      );
    case "conditional":
      return (
        <ConditionalTriggerForm
          metadata={props.metadata as any}
          setMetadata={props.setMetadata}
          setMarketType={props.setMarketType!}
          marketType={props.marketType ?? null}
        />
      );
    case "market-session":
      return (
        <MarketSessionTriggerForm
          metadata={props.metadata as any}
          setMetadata={props.setMetadata}
          setMarketType={props.setMarketType!}
          marketType={props.marketType ?? null}
        />
      );
    case "gmail":
      return <GmailForm metadata={props.metadata as any} setMetadata={props.setMetadata} />;
    case "slack":
      return <SlackForm metadata={props.metadata as any} setMetadata={props.setMetadata} />;
    case "telegram":
      return <TelegramForm metadata={props.metadata as any} setMetadata={props.setMetadata} />;
    case "discord":
      return <DiscordForm metadata={props.metadata as any} setMetadata={props.setMetadata} />;
    case "whatsapp":
      return <WhatsappForm metadata={props.metadata as any} setMetadata={props.setMetadata} />;
    case "delay":
      return <DelayForm metadata={props.metadata as any} setMetadata={props.setMetadata} />;
    case "notion-daily-report":
      return <NotionDailyReportForm metadata={props.metadata as any} setMetadata={props.setMetadata} />;
    case "google-drive-daily-csv":
      return <GoogleDriveDailyCsvForm metadata={props.metadata as any} setMetadata={props.setMetadata} />;
    case "google-sheets-report":
      return <GoogleSheetsReportForm metadata={props.metadata as any} setMetadata={props.setMetadata} />;
    default:
      return null;
  }
}

export function getBuilderNodeRenderer(nodeType: string) {
  const rendererId = getNodeRegistryEntry(nodeType)?.builderRendererId || nodeType;
  return builderNodeRenderers[rendererId as keyof typeof builderNodeRenderers];
}

export function getBuilderPanelGroupForNodeType(nodeType: string): BuilderPanelGroup | undefined {
  return getNodeRegistryEntry(nodeType)?.builderPanelGroup;
}
