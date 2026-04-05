import type { ExecutorActionHandlerId } from "@quantnest-trading/node-registry";
import { delayActionHandler, noopActionHandler } from "./flow-control";
import {
  discordActionHandler,
  gmailActionHandler,
  slackActionHandler,
  telegramActionHandler,
  whatsappActionHandler,
} from "./notifications";
import {
  googleDriveActionHandler,
  googleSheetsActionHandler,
  notionActionHandler,
} from "./reporting";
import {
  growwActionHandler,
  lighterActionHandler,
  zerodhaActionHandler,
} from "./trading";

export const actionHandlerMap: Record<ExecutorActionHandlerId, any> = {
  noop: noopActionHandler,
  delay: delayActionHandler,
  zerodha: zerodhaActionHandler,
  groww: growwActionHandler,
  lighter: lighterActionHandler,
  gmail: gmailActionHandler,
  slack: slackActionHandler,
  telegram: telegramActionHandler,
  discord: discordActionHandler,
  whatsapp: whatsappActionHandler,
  "notion-daily-report": notionActionHandler,
  "google-drive-daily-csv": googleDriveActionHandler,
  "google-sheets-report": googleSheetsActionHandler,
};

export type { ActionHandler, ActionHandlerParams, ExecuteActionNodeParams } from "./shared";
